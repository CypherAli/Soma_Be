import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const scrypt = promisify(scryptCallback);
const SESSION_LIFETIME_MS = 1000 * 60 * 60 * 24 * 30;
type Provider = 'google' | 'github' | 'facebook';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('Email này đã được sử dụng');
    }
    const user = await this.prisma.user.create({
      data: { name: dto.name.trim(), email, passwordHash: await this.hashPassword(dto.password) },
    });
    return this.createSession(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });
    if (!user?.passwordHash || !(await this.verifyPassword(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    return this.createSession(user);
  }

  async me(token?: string) {
    const session = await this.findSession(token);
    if (!session) throw new UnauthorizedException('Phiên đăng nhập không hợp lệ hoặc đã hết hạn');
    return { user: this.publicUser(session.user) };
  }

  async logout(token?: string) {
    if (token) await this.prisma.session.deleteMany({ where: { tokenHash: this.hashToken(token) } });
    return { success: true };
  }

  async oauthUrl(provider: Provider) {
    const config = this.providerConfig(provider);
    const state = randomBytes(32).toString('base64url');
    const verifier = randomBytes(32).toString('base64url');
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    await this.prisma.oAuthState.create({ data: { stateHash: this.hashToken(state), provider, codeVerifier: verifier, expiresAt: new Date(Date.now() + 600000) } });
    const params = new URLSearchParams({ client_id: config.id, redirect_uri: config.callback, response_type: 'code', scope: config.scope, state, code_challenge: challenge, code_challenge_method: 'S256' });
    return `${config.authorize}?${params}`;
  }

  async oauthCallback(provider: Provider, code: string, state: string) {
    const record = await this.prisma.oAuthState.findFirst({ where: { stateHash: this.hashToken(state), provider, expiresAt: { gt: new Date() } } });
    if (!record) throw new UnauthorizedException('Yêu cầu OAuth không hợp lệ hoặc đã hết hạn');
    await this.prisma.oAuthState.delete({ where: { id: record.id } });
    const c = this.providerConfig(provider);
    const tokenResponse = await fetch(c.token, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: c.id, client_secret: c.secret, code, redirect_uri: c.callback, grant_type: 'authorization_code', code_verifier: record.codeVerifier }) });
    const tokens = await tokenResponse.json() as { access_token?: string };
    if (!tokens.access_token) throw new UnauthorizedException('Không thể xác thực với nhà cung cấp');
    const profile = await this.providerProfile(provider, tokens.access_token);
    const idField = `${provider}Id` as 'googleId' | 'githubId' | 'facebookId';
    let user = await this.prisma.user.findFirst({ where: { OR: [{ [idField]: profile.id }, { email: profile.email }] } });
    user = user ? await this.prisma.user.update({ where: { id: user.id }, data: { [idField]: profile.id } }) : await this.prisma.user.create({ data: { name: profile.name, email: profile.email, [idField]: profile.id } });
    return this.createSession(user);
  }

  private providerConfig(provider: Provider) {
    const base = process.env.API_URL ?? 'http://localhost:4000/api';
    const configs = {
      google: { id: process.env.GOOGLE_CLIENT_ID, secret: process.env.GOOGLE_CLIENT_SECRET, authorize: 'https://accounts.google.com/o/oauth2/v2/auth', token: 'https://oauth2.googleapis.com/token', scope: 'openid email profile' },
      github: { id: process.env.GITHUB_CLIENT_ID, secret: process.env.GITHUB_CLIENT_SECRET, authorize: 'https://github.com/login/oauth/authorize', token: 'https://github.com/login/oauth/access_token', scope: 'read:user user:email' },
      facebook: { id: process.env.FACEBOOK_CLIENT_ID, secret: process.env.FACEBOOK_CLIENT_SECRET, authorize: 'https://www.facebook.com/v23.0/dialog/oauth', token: 'https://graph.facebook.com/v23.0/oauth/access_token', scope: 'email public_profile' },
    }[provider];
    if (!configs?.id || !configs.secret) throw new ConflictException(`Đăng nhập ${provider} chưa được cấu hình`);
    return { ...configs, id: configs.id, secret: configs.secret, callback: `${base}/auth/oauth/${provider}/callback` };
  }

  private async providerProfile(provider: Provider, token: string) {
    if (provider === 'google') return this.fetchProfile('https://openidconnect.googleapis.com/v1/userinfo', token);
    if (provider === 'facebook') return this.fetchProfile(`https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(token)}`);
    const user = await this.fetchProfile('https://api.github.com/user', token) as { id: string; name?: string; login?: string; email?: string };
    if (!user.email) { const emails = await this.fetchProfile('https://api.github.com/user/emails', token) as Array<{ email: string; primary: boolean; verified: boolean }>; user.email = emails.find((e) => e.primary && e.verified)?.email; }
    if (!user.email) throw new UnauthorizedException('Tài khoản không cung cấp email đã xác minh');
    return { id: String(user.id), name: user.name || user.login || 'GitHub user', email: user.email };
  }

  private async fetchProfile(url: string, token?: string): Promise<any> {
    const response = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}`, Accept: 'application/json', 'User-Agent': 'Soma3D' } : {} });
    if (!response.ok) throw new UnauthorizedException('Không lấy được thông tin tài khoản');
    const data = await response.json();
    if (!data.email) throw new UnauthorizedException('Tài khoản không cung cấp email');
    return { ...data, id: String(data.sub ?? data.id), name: data.name ?? data.email };
  }

  private async createSession(user: { id: string; name: string; email: string }) {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);
    await this.prisma.session.create({
      data: { tokenHash: this.hashToken(token), expiresAt, userId: user.id },
    });
    return { token, expiresAt, user: this.publicUser(user) };
  }

  private findSession(token?: string) {
    if (!token) return null;
    return this.prisma.session.findFirst({
      where: { tokenHash: this.hashToken(token), expiresAt: { gt: new Date() } },
      include: { user: true },
    });
  }

  private publicUser(user: { id: string; name: string; email: string }) {
    return { id: user.id, name: user.name, email: user.email };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const derived = (await scrypt(password, salt, 64)) as Buffer;
    return `scrypt:${salt}:${derived.toString('hex')}`;
  }

  private async verifyPassword(password: string, encoded: string) {
    const [algorithm, salt, storedHex] = encoded.split(':');
    if (algorithm !== 'scrypt' || !salt || !storedHex) return false;
    const stored = Buffer.from(storedHex, 'hex');
    const derived = (await scrypt(password, salt, stored.length)) as Buffer;
    return stored.length === derived.length && timingSafeEqual(stored, derived);
  }
}
