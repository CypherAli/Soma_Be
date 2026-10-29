import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'crypto';
import { promisify } from 'util';
import { Prisma, User, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from './roles';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from './mail.service';
import { MobileOAuthStartDto } from './dto/mobile-oauth.dto';
import { mobileReturnUrl } from './mobile-return';
import { activePlan } from '../membership/policy';
import { passwordResetFrontend } from './password-reset-url';

const scrypt = promisify(scryptCallback);
const SESSION_LIFETIME_MS = 1000 * 60 * 60 * 24 * 30;
/** Ngưỡng ghi lại `lastSeenAt` — xem mục chú thích trong schema. */
const SEEN_REFRESH_MS = 1000 * 60 * 5;
/** Trần cho data URL ảnh đại diện. Trình duyệt đã thu nhỏ về 256px trước khi gửi. */
const MAX_AVATAR_BYTES = 220_000;
type Provider = 'google' | 'github' | 'facebook';

/** Hồ sơ tài khoản đã chuẩn hoá về cùng một hình dạng cho cả ba nhà cung cấp. */
type OAuthProfile = { id: string; name: string; email: string };

/** Thân JSON của Google (OIDC dùng `sub`) và Facebook (dùng `id`). */
type OidcProfileBody = {
  sub?: string;
  id?: string;
  email?: string;
  email_verified?: boolean;
  verified?: boolean;
  name?: string;
};

type GithubUserBody = {
  id: number | string;
  name?: string | null;
  login?: string;
  email?: string | null;
};

type GithubEmailBody = { email: string; primary: boolean; verified: boolean };

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  capabilities() {
    return {
      passwordReset: this.mail.configured && Boolean(passwordResetFrontend()),
      mobileOAuth: Boolean(this.mobileOAuthBase()),
      oauth: {
        google: Boolean(
          process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
        ),
        github: Boolean(
          process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET,
        ),
        facebook: Boolean(
          process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET,
        ),
      },
    };
  }

  /** Mật khẩu mạnh tối thiểu: ≥8 ký tự, có cả chữ và số. */
  mobileCapabilities(returnUrl?: string) {
    const ready = (provider: Provider) => {
      if (!this.mobileOAuthBase(returnUrl) || !mobileReturnUrl(returnUrl))
        return false;
      try {
        this.providerConfig(provider, true);
        return true;
      } catch {
        return false;
      }
    };
    return {
      mobileOAuth:
        Boolean(this.mobileOAuthBase(returnUrl)) &&
        Boolean(mobileReturnUrl(returnUrl)),
      returnAllowed: Boolean(mobileReturnUrl(returnUrl)),
      oauth: {
        google: ready('google'),
        github: ready('github'),
        facebook: ready('facebook'),
      },
    };
  }

  private assertStrongPassword(password: string) {
    if (
      password.length < 8 ||
      !/[A-Za-z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      throw new BadRequestException(
        'Mật khẩu phải có ít nhất 8 ký tự, gồm cả chữ và số',
      );
    }
  }

  async register(dto: RegisterDto, userAgent?: string) {
    const email = dto.email.trim().toLowerCase();
    this.assertStrongPassword(dto.password);
    if (
      await this.prisma.user.findUnique({ where: { passwordEmail: email } })
    ) {
      throw new ConflictException('Email này đã được sử dụng');
    }
    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        passwordEmail: email,
        passwordHash: await this.hashPassword(dto.password),
      },
    });
    return this.createSession(user, userAgent);
  }

  async login(dto: LoginDto, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { passwordEmail: dto.email.trim().toLowerCase() },
    });
    if (
      !user?.passwordHash ||
      !(await this.verifyPassword(dto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    this.assertEnabled(user);
    return this.createSession(user, userAgent);
  }

  async me(token?: string) {
    const session = await this.findSession(token);
    if (!session)
      throw new UnauthorizedException(
        'Phiên đăng nhập không hợp lệ hoặc đã hết hạn',
      );
    // Tài khoản bị khoá phải văng ngay cả khi session còn hạn.
    if (session.user.disabledAt)
      throw new UnauthorizedException('Tài khoản đã bị khoá');
    await this.touchSession(session.id, session.lastSeenAt);
    return { user: this.profile(session.user) };
  }

  /**
   * Tự đổi mật khẩu.
   *
   * Bắt nhập mật khẩu HIỆN TẠI dù người dùng đã đăng nhập: một phiên bị bỏ quên
   * trên máy công cộng mà đổi được mật khẩu thì kẻ ngồi sau chiếm luôn tài
   * khoản, còn chủ tài khoản mất đường vào.
   *
   * Đổi xong CẮT HẾT phiên khác và cấp phiên mới cho chính người vừa đổi. Đây
   * là điểm chính của việc đổi mật khẩu — nếu các phiên cũ vẫn sống thì đổi
   * mật khẩu không đuổi được ai ra cả.
   *
   * Tài khoản chỉ đăng nhập bằng Google/GitHub (`passwordHash` rỗng) thì không
   * có mật khẩu để đổi; nói thẳng thay vì im lặng đặt một mật khẩu mới.
   */
  async changePassword(
    dto: ChangePasswordDto,
    token?: string,
    userAgent?: string,
  ) {
    const session = await this.requireSession(token);
    const user = session.user;

    if (!user.passwordHash) {
      throw new ConflictException(
        'Tài khoản này đăng nhập bằng nhà cung cấp bên ngoài, không có mật khẩu để đổi',
      );
    }
    if (!(await this.verifyPassword(dto.currentPassword, user.passwordHash))) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new ConflictException('Mật khẩu mới phải khác mật khẩu hiện tại');
    }
    this.assertStrongPassword(dto.newPassword);

    const passwordHash = await this.hashPassword(dto.newPassword);
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
      await tx.session.deleteMany({ where: { userId: user.id } });
      return this.createSession(updated, userAgent, tx);
    });
  }

  async logout(token?: string) {
    if (token)
      await this.prisma.session.deleteMany({
        where: { tokenHash: this.hashToken(token) },
      });
    return { success: true };
  }

  /**
   * Quên mật khẩu: luôn trả cùng một thông điệp dù email có tồn tại hay không
   * (chống dò email). Token dùng một lần, hết hạn 15 phút.
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    if (!this.mail.configured) {
      throw new ServiceUnavailableException(
        'Chức năng gửi email chưa được cấu hình. Vui lòng liên hệ quản trị viên.',
      );
    }
    const frontend = passwordResetFrontend();
    if (!frontend) {
      throw new ServiceUnavailableException(
        'Địa chỉ web đặt lại mật khẩu chưa hợp lệ. Quản trị viên cần cấu hình PASSWORD_RESET_FRONTEND_URL bằng địa chỉ HTTPS truy cập được.',
      );
    }
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { passwordEmail: email },
    });
    if (user && !user.disabledAt) {
      // Thu hồi token cũ chưa dùng để link trong email cũ hết hiệu lực.
      await this.prisma.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null },
      });
      const token = randomBytes(32).toString('base64url');
      const reset = await this.prisma.passwordResetToken.create({
        data: {
          tokenHash: this.hashToken(token),
          userId: user.id,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      });
      const link = `${frontend}/vi/dat-lai-mat-khau?token=${encodeURIComponent(token)}`;
      const delivery = await this.mail.sendPasswordReset(email, link);
      if (!delivery.sent) {
        await this.prisma.passwordResetToken.deleteMany({
          where: { id: reset.id, usedAt: null },
        });
        throw new ServiceUnavailableException(
          'Chưa gửi được email đặt lại mật khẩu. Vui lòng thử lại sau.',
        );
      }
    }
    return {
      message:
        'Nếu email này đã đăng ký, link đặt lại mật khẩu đã được gửi (hết hạn sau 15 phút)',
    };
  }

  /** Đặt lại mật khẩu bằng token trong email, xong cắt hết phiên cũ. */
  async resetPassword(dto: ResetPasswordDto) {
    this.assertStrongPassword(dto.newPassword);
    const record = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash: this.hashToken(dto.token),
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
      include: { user: true },
    });
    if (!record || !record.user.passwordHash || !record.user.passwordEmail)
      throw new BadRequestException(
        'Link đặt lại không hợp lệ hoặc đã hết hạn',
      );
    if (record.user.disabledAt)
      throw new UnauthorizedException('Tài khoản đã bị khoá');
    const passwordHash = await this.hashPassword(dto.newPassword);
    await this.prisma.$transaction(async (tx) => {
      // Atomically claim the token: a concurrent request must update zero rows.
      const now = new Date();
      const claimed = await tx.passwordResetToken.updateMany({
        where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (claimed.count !== 1) {
        throw new BadRequestException(
          'Link đặt lại không hợp lệ hoặc đã hết hạn',
        );
      }
      await tx.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      });
      await tx.session.deleteMany({ where: { userId: record.userId } });
    });
    return { message: 'Đã đặt lại mật khẩu, hãy đăng nhập lại' };
  }

  /**
   * Địa chỉ chuyển hướng sang nhà cung cấp.
   *
   * Có `linkToken` nghĩa là người dùng ĐANG đăng nhập và muốn gắn thêm một
   * cách đăng nhập, không phải đang đăng nhập mới. Ghi chủ nhân vào bản ghi
   * state ngay từ đầu để callback khỏi phải tin vào tham số trên URL.
   */
  async oauthUrl(
    provider: Provider,
    linkToken?: string,
    mobile?: MobileOAuthStartDto,
  ) {
    const returnUrl = mobile ? mobileReturnUrl(mobile.returnUrl) : null;
    if (mobile && !returnUrl)
      throw new BadRequestException(
        'Đường dẫn quay lại ứng dụng chưa được cho phép trên máy chủ.',
      );
    const config = this.providerConfig(provider, Boolean(mobile));
    const mobileBase = mobile
      ? this.mobileOAuthBase(returnUrl || undefined)
      : null;
    if (mobile && !mobileBase)
      throw new ConflictException(
        'Đăng nhập mạng xã hội trên app đang chờ cấu hình callback HTTPS.',
      );
    const callback = mobileBase
      ? `${mobileBase}/auth/oauth/${provider}/callback`
      : config.callback;
    if (mobile) {
      await this.prisma.mobileOAuthCode.deleteMany({
        where: { expiresAt: { lte: new Date() } },
      });
      await this.prisma.oAuthState.deleteMany({
        where: { expiresAt: { lte: new Date() } },
      });
    }
    let linkUserId: string | undefined;
    if (linkToken) {
      const session = await this.requireSession(linkToken);
      linkUserId = session.userId;
    }
    const state = randomBytes(32).toString('base64url');
    const verifier = randomBytes(32).toString('base64url');
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    await this.prisma.oAuthState.create({
      data: {
        stateHash: this.hashToken(state),
        provider,
        codeVerifier: verifier,
        ...(mobile
          ? {
              mobileChallenge: mobile.challenge,
              mobileState: mobile.state,
              mobileReturnUrl: returnUrl,
              callbackUrl: callback,
            }
          : {}),
        linkUserId,
        expiresAt: new Date(Date.now() + 600000),
      },
    });
    const params = new URLSearchParams({
      client_id: config.id,
      redirect_uri: callback,
      response_type: 'code',
      scope: config.scope,
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });
    return `${config.authorize}?${params}`;
  }

  async oauthCallback(
    provider: Provider,
    code: string,
    state: string,
    userAgent?: string,
  ) {
    const record = await this.prisma.oAuthState.findFirst({
      where: {
        stateHash: this.hashToken(state),
        provider,
        expiresAt: { gt: new Date() },
      },
    });
    if (!record)
      throw new UnauthorizedException(
        'Yêu cầu OAuth không hợp lệ hoặc đã hết hạn',
      );
    await this.prisma.oAuthState.delete({ where: { id: record.id } });
    const c = this.providerConfig(provider, Boolean(record.mobileChallenge));
    const tokenResponse = await fetch(c.token, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: c.id,
        client_secret: c.secret,
        code,
        redirect_uri: record.callbackUrl || c.callback,
        grant_type: 'authorization_code',
        code_verifier: record.codeVerifier,
      }),
    });
    const tokens = (await tokenResponse.json()) as { access_token?: string };
    if (!tokens.access_token)
      throw new UnauthorizedException('Không thể xác thực với nhà cung cấp');
    const profile = await this.providerProfile(provider, tokens.access_token);
    const idField = `${provider}Id`;

    if (record.linkUserId) {
      const linked = await this.linkProvider(
        record.linkUserId,
        provider,
        profile.id,
      );
      if (!record.mobileChallenge || !record.mobileState) return linked;
      const mobileCode = randomBytes(32).toString('base64url');
      await this.prisma.mobileOAuthCode.create({
        data: {
          codeHash: this.hashToken(mobileCode),
          userId: linked.user.id,
          challenge: record.mobileChallenge,
          expiresAt: new Date(Date.now() + 60000),
        },
      });
      return { mobileCode, mobileState: record.mobileState };
    }

    // A provider ID identifies its account. Equal contact emails never merge
    // accounts; sharing an account requires an explicit authenticated link.
    let user = await this.prisma.user.findFirst({
      where: { [idField]: profile.id },
    });
    user = user
      ? user
      : await this.prisma.user.create({
          data: {
            name: profile.name,
            email: profile.email,
            [idField]: profile.id,
          },
        });
    this.assertEnabled(user);
    if (record.mobileChallenge && record.mobileState) {
      const mobileCode = randomBytes(32).toString('base64url');
      await this.prisma.mobileOAuthCode.create({
        data: {
          codeHash: this.hashToken(mobileCode),
          userId: user.id,
          challenge: record.mobileChallenge,
          expiresAt: new Date(Date.now() + 60000),
        },
      });
      return { mobileCode, mobileState: record.mobileState };
    }
    return this.createSession(user, userAgent);
  }

  private mobileOAuthBase(returnUrl?: string) {
    // Desktop Expo may use a configured loopback callback without a public tunnel.
    // Both addresses are server-owned; an arbitrary return URL cannot select it.
    if (
      returnUrl &&
      mobileReturnUrl(returnUrl) &&
      process.env.NODE_ENV !== 'production'
    ) {
      try {
        const target = new URL(returnUrl);
        const desktop = new URL(process.env.DESKTOP_OAUTH_API_URL || '');
        const loopback = (url: URL) =>
          ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
        if (
          target.protocol === 'http:' &&
          loopback(target) &&
          desktop.protocol === 'http:' &&
          loopback(desktop) &&
          !desktop.username &&
          !desktop.password &&
          !desktop.search &&
          !desktop.hash
        )
          return desktop.href.replace(/\/$/, '');
      } catch {
        /* Fall through to the public mobile callback. */
      }
    }
    // Server configuration only. Never derive an OAuth redirect from Host or a client URL.
    try {
      const url = new URL(process.env.MOBILE_OAUTH_API_URL || '');
      if (
        url.protocol !== 'https:' ||
        url.username ||
        url.password ||
        url.search ||
        url.hash
      )
        return null;
      return url.href.replace(/\/$/, '');
    } catch {
      return null;
    }
  }

  async mobileOAuthContext(provider: Provider, state: string) {
    if (!/^[A-Za-z0-9_-]{43}$/.test(state || '')) return null;
    const record = await this.prisma.oAuthState.findFirst({
      where: {
        stateHash: this.hashToken(state),
        provider,
        expiresAt: { gt: new Date() },
      },
    });
    return record?.mobileState
      ? {
          state: record.mobileState,
          id: record.id,
          returnUrl: record.mobileReturnUrl || 'soma://oauth',
        }
      : null;
  }

  async discardOAuthState(id: string) {
    await this.prisma.oAuthState.deleteMany({ where: { id } });
  }

  async exchangeMobileOAuth(
    code: string,
    verifier: string,
    userAgent?: string,
  ) {
    const codeHash = this.hashToken(code);
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    return this.prisma.$transaction(async (tx) => {
      const record = await tx.mobileOAuthCode.findUnique({
        where: { codeHash },
      });
      if (
        !record ||
        record.expiresAt.getTime() <= Date.now() ||
        record.challenge !== challenge
      )
        throw new UnauthorizedException(
          'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.',
        );
      const consumed = await tx.mobileOAuthCode.deleteMany({
        where: { codeHash, expiresAt: { gt: new Date() } },
      });
      if (consumed.count !== 1)
        throw new UnauthorizedException('Phiên đăng nhập đã được sử dụng.');
      const user = await tx.user.findUnique({ where: { id: record.userId } });
      if (!user)
        throw new UnauthorizedException('Tài khoản không còn tồn tại.');
      this.assertEnabled(user);
      return this.createSession(user, userAgent, tx);
    });
  }

  /**
   * Gắn id nhà cung cấp vào một tài khoản đang đăng nhập.
   *
   * Từ chối khi id đó đã thuộc người khác — nếu ghi đè, hai tài khoản cùng trỏ
   * về một Google và người kia mất lối vào của họ.
   */
  private async linkProvider(
    userId: string,
    provider: Provider,
    providerId: string,
  ) {
    const idField = `${provider}Id`;
    const account = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!account) throw new UnauthorizedException('Cần đăng nhập');
    this.assertEnabled(account);
    const owner = await this.prisma.user.findFirst({
      where: { [idField]: providerId },
    });
    if (owner && owner.id !== userId) {
      throw new ConflictException(
        `Tài khoản ${provider} này đã liên kết với một người dùng khác`,
      );
    }
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { [idField]: providerId },
    });
    return { linked: provider, user: this.profile(user) };
  }

  /**
   * Sửa hồ sơ: tên hiển thị và/hoặc ảnh đại diện.
   *
   * Ảnh nhận vào là data URL đã thu nhỏ ở trình duyệt. Vẫn phải kiểm lại kích
   * thước và kiểu ở đây — người gọi API không bắt buộc phải là giao diện của
   * mình, và một chuỗi vài megabyte nằm trong cột `users.avatar` thì mọi truy
   * vấn người dùng đều è cổ ra tải.
   */
  async updateProfile(dto: UpdateProfileDto, token?: string) {
    const session = await this.requireSession(token);

    const data: {
      name?: string;
      avatar?: string | null;
      learningRole?: string;
    } = {};
    if (dto.learningRole !== undefined) {
      if (!['learner', 'teacher'].includes(dto.learningRole))
        throw new BadRequestException('Vai trò học tập không hợp lệ');
      data.learningRole = dto.learningRole;
    }
    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (name.length < 2) {
        throw new BadRequestException('Tên hiển thị phải có ít nhất 2 ký tự');
      }
      data.name = name;
    }
    if (dto.avatar !== undefined) {
      data.avatar = dto.avatar === null ? null : this.checkAvatar(dto.avatar);
    }
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Không có gì để cập nhật');
    }

    const user = await this.prisma.user.update({
      where: { id: session.userId },
      data,
    });
    return { user: this.profile(user) };
  }

  private checkAvatar(value: string) {
    const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(
      value,
    );
    if (!match) {
      throw new BadRequestException(
        'Ảnh đại diện phải là data URL PNG, JPEG hoặc WEBP',
      );
    }
    if (Buffer.byteLength(value, 'utf8') > MAX_AVATAR_BYTES) {
      throw new BadRequestException('Ảnh đại diện quá lớn (tối đa 200 KB)');
    }
    return value;
  }

  /**
   * Danh sách phiên đang sống của tài khoản, phiên hiện tại đứng đầu.
   *
   * Đây là công cụ tự bảo vệ: quên đăng xuất ở máy trường thì phải thấy được
   * phiên đó và cắt được nó mà không cần đổi mật khẩu.
   */
  async sessions(token?: string) {
    const session = await this.requireSession(token);
    const rows = await this.prisma.session.findMany({
      where: { userId: session.userId, expiresAt: { gt: new Date() } },
      orderBy: { lastSeenAt: 'desc' },
    });
    return {
      sessions: rows.map((row) => ({
        id: row.id,
        userAgent: row.userAgent,
        createdAt: row.createdAt,
        lastSeenAt: row.lastSeenAt,
        expiresAt: row.expiresAt,
        current: row.id === session.id,
      })),
    };
  }

  /** Cắt một phiên khác. Không cho tự cắt phiên đang dùng — đó là "Đăng xuất". */
  async revokeSession(id: string, token?: string) {
    const session = await this.requireSession(token);
    if (id === session.id) {
      throw new ConflictException('Đây là phiên hiện tại, hãy dùng Đăng xuất');
    }
    const target = await this.prisma.session.findUnique({ where: { id } });
    if (!target || target.userId !== session.userId) {
      throw new NotFoundException('Không tìm thấy phiên này');
    }
    await this.prisma.session.delete({ where: { id } });
    return { success: true };
  }

  /** Cắt mọi phiên KHÁC, giữ lại phiên đang dùng. */
  async revokeOtherSessions(token?: string) {
    const session = await this.requireSession(token);
    const { count } = await this.prisma.session.deleteMany({
      where: { userId: session.userId, id: { not: session.id } },
    });
    return { revoked: count };
  }

  /**
   * Gỡ liên kết một nhà cung cấp.
   *
   * Chặn khi đó là lối vào CUỐI CÙNG: tài khoản tạo bằng Google chưa từng đặt
   * mật khẩu mà gỡ Google là mất hẳn đường đăng nhập, dữ liệu học còn nguyên
   * trong máy chủ mà chủ nhân không vào được nữa.
   */
  async unlinkProvider(provider: Provider, token?: string) {
    const session = await this.requireSession(token);
    const user = session.user;
    const idField = `${provider}Id` as const;
    if (!user[idField]) {
      throw new ConflictException(`Tài khoản chưa liên kết ${provider}`);
    }
    const remaining =
      (user.passwordHash ? 1 : 0) +
      [user.googleId, user.githubId, user.facebookId].filter(Boolean).length -
      1;
    if (remaining < 1) {
      throw new ConflictException(
        'Đây là cách đăng nhập duy nhất của tài khoản — hãy đặt mật khẩu hoặc liên kết một nhà cung cấp khác trước',
      );
    }
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { [idField]: null },
    });
    return { user: this.profile(updated) };
  }

  /**
   * Chặn tài khoản đã bị khoá ở CẢ hai lối vào (mật khẩu và OAuth).
   *
   * Chỉ chặn ở `login` thì người bị khoá vẫn vào được bằng nút "Đăng nhập với
   * Google" — mà OAuth còn tự tạo lại tài khoản nếu khớp email, nên lỗ hổng đó
   * im lặng hoàn toàn.
   */
  private assertEnabled(user: { disabledAt: Date | null }) {
    if (user.disabledAt) {
      throw new UnauthorizedException('Tài khoản đã bị khoá');
    }
  }

  private providerConfig(provider: Provider, mobile = false) {
    const base = process.env.API_URL ?? 'http://localhost:4000/api';
    const configs = {
      google: {
        id: process.env.GOOGLE_CLIENT_ID,
        secret: process.env.GOOGLE_CLIENT_SECRET,
        authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
        token: 'https://oauth2.googleapis.com/token',
        scope: 'openid email profile',
      },
      github: {
        id: process.env.GITHUB_CLIENT_ID,
        secret: process.env.GITHUB_CLIENT_SECRET,
        authorize: 'https://github.com/login/oauth/authorize',
        token: 'https://github.com/login/oauth/access_token',
        scope: 'read:user user:email',
      },
      facebook: {
        id: process.env.FACEBOOK_CLIENT_ID,
        secret: process.env.FACEBOOK_CLIENT_SECRET,
        authorize: 'https://www.facebook.com/v23.0/dialog/oauth',
        token: 'https://graph.facebook.com/v23.0/oauth/access_token',
        scope: 'email public_profile',
      },
    }[provider];
    if (configs && mobile) {
      const prefix = `MOBILE_${provider.toUpperCase()}_CLIENT`;
      const id = process.env[`${prefix}_ID`],
        secret = process.env[`${prefix}_SECRET`];
      if (id || secret) {
        configs.id = id;
        configs.secret = secret;
      }
    }
    if (!configs?.id || !configs.secret)
      throw new ConflictException(`Đăng nhập ${provider} chưa được cấu hình`);
    return {
      ...configs,
      id: configs.id,
      secret: configs.secret,
      callback: `${base}/auth/oauth/${provider}/callback`,
    };
  }

  private async providerProfile(
    provider: Provider,
    token: string,
  ): Promise<OAuthProfile> {
    if (provider === 'google')
      return this.normalizeOidcProfile(
        await this.fetchJson<OidcProfileBody>(
          'https://openidconnect.googleapis.com/v1/userinfo',
          token,
        ),
      );
    if (provider === 'facebook')
      return this.normalizeOidcProfile(
        await this.fetchJson<OidcProfileBody>(
          `https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(token)}`,
        ),
      );

    const user = await this.fetchJson<GithubUserBody>(
      'https://api.github.com/user',
      token,
    );
    // GitHub KHÔNG trả email nếu người dùng đặt địa chỉ ở chế độ riêng tư, phải
    // hỏi thêm /user/emails. Trước đây nhánh dự phòng này không bao giờ chạy
    // tới: hàm tải hồ sơ dùng chung đã ném lỗi "không cung cấp email" ngay ở
    // lượt gọi đầu, nên đăng nhập GitHub hỏng với đúng nhóm người dùng đó.
    const email =
      user.email ??
      (
        await this.fetchJson<GithubEmailBody[]>(
          'https://api.github.com/user/emails',
          token,
        )
      ).find((e) => e.primary && e.verified)?.email;
    if (!email)
      throw new UnauthorizedException(
        'Tài khoản không cung cấp email đã xác minh',
      );
    return {
      id: String(user.id),
      name: user.name || user.login || 'GitHub user',
      email: email.trim().toLowerCase(),
    };
  }

  /** Google và Facebook trả cùng một hình dạng, chỉ khác tên trường định danh. */
  private normalizeOidcProfile(body: OidcProfileBody): OAuthProfile {
    const id = body.sub ?? body.id;
    if (!id || !body.email)
      throw new UnauthorizedException('Tài khoản không cung cấp email');
    // Google trả email_verified; Facebook email cũng cần đã xác minh mới tin.
    if (body.email_verified === false || body.verified === false)
      throw new UnauthorizedException(
        'Email chưa được xác minh với nhà cung cấp',
      );
    return {
      id: String(id),
      name: body.name ?? body.email,
      email: body.email.trim().toLowerCase(),
    };
  }

  /**
   * Gọi API của nhà cung cấp và ép kiểu thân JSON.
   *
   * KHÔNG kiểm tra email ở đây: cùng hàm này còn dùng để lấy DANH SÁCH email
   * của GitHub, mà một mảng thì không có trường `email` nào cả.
   */
  private async fetchJson<T>(url: string, token?: string): Promise<T> {
    const response = await fetch(url, {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'User-Agent': 'Soma3D',
          }
        : {},
    });
    if (!response.ok)
      throw new UnauthorizedException('Không lấy được thông tin tài khoản');
    return (await response.json()) as T;
  }

  /**
   * Người dùng của token, hoặc `null` khi thiếu / sai / hết hạn / bị khoá.
   *
   * [AuthGuard] gọi hàm này. Trả `null` thay vì ném lỗi để phía gọi tự quyết
   * định là chặn hay chỉ bỏ qua — endpoint công khai vẫn muốn biết ai đang xem.
   */
  async userFromToken(token?: string): Promise<AuthUser | null> {
    const session = await this.findSession(token);
    // Tài khoản bị khoá thì phiên cũ phải mất hiệu lực ngay, không đợi hết hạn:
    // khoá một tài khoản mà nó vẫn dùng được thêm 30 ngày là không khoá gì cả.
    if (!session || session.user.disabledAt) return null;
    return this.publicUser(session.user);
  }

  private async createSession(
    user: User,
    userAgent?: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);
    await db.session.create({
      data: {
        tokenHash: this.hashToken(token),
        expiresAt,
        userId: user.id,
        userAgent: userAgent?.slice(0, 400),
        // Ghi rõ chứ không để mặc định CURRENT_TIMESTAMP của Postgres: cột là
        // `timestamp` không múi giờ nên mặc định lấy giờ ĐỊA PHƯƠNG của máy
        // chủ, còn `createdAt` do Prisma sinh theo UTC — lệch nhau đúng bằng
        // múi giờ, và trang Bảo mật hiện "hoạt động lần cuối" ở tương lai.
        lastSeenAt: new Date(),
      },
    });
    return { token, expiresAt, user: this.profile(user) };
  }

  /** Ghi `lastSeenAt` nhưng chỉ khi đã cũ — tránh mỗi lần đọc kèm một lần ghi. */
  private async touchSession(id: string, lastSeenAt: Date) {
    if (Date.now() - lastSeenAt.getTime() < SEEN_REFRESH_MS) return;
    await this.prisma.session
      .update({ where: { id }, data: { lastSeenAt: new Date() } })
      .catch(() => undefined);
  }

  private findSession(token?: string) {
    if (!token) return null;
    return this.prisma.session.findFirst({
      where: {
        tokenHash: this.hashToken(token),
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });
  }

  private async requireSession(token?: string) {
    const session = await this.findSession(token);
    if (!session) throw new UnauthorizedException('Cần đăng nhập');
    this.assertEnabled(session.user);
    return session;
  }

  /**
   * Hồ sơ đầy đủ cho trang tài khoản.
   *
   * Có `connections` và `hasPassword` vì giao diện cần biết CÒN LẠI mấy lối
   * đăng nhập: bỏ liên kết cuối cùng là tự khoá mình ra ngoài, nên nút gỡ phải
   * mờ đi từ trước chứ không đợi máy chủ từ chối.
   */
  private profile(user: User) {
    const sandbox =
      process.env.SEPAY_PG_ENABLED === 'true' &&
      process.env.SEPAY_PG_ENV === 'sandbox';
    return {
      ...this.publicUser(user),
      plan: activePlan(user, new Date(), sandbox),
      learningRole: user.learningRole,
      premiumUntil:
        sandbox &&
        user.sandboxPremiumUntil &&
        (!user.premiumUntil || user.sandboxPremiumUntil > user.premiumUntil)
          ? user.sandboxPremiumUntil
          : user.premiumUntil,
      avatar: user.avatar,
      createdAt: user.createdAt,
      hasPassword: Boolean(user.passwordHash),
      connections: {
        google: Boolean(user.googleId),
        github: Boolean(user.githubId),
        facebook: Boolean(user.facebookId),
      },
    };
  }

  private publicUser(user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  }) {
    return { id: user.id, name: user.name, email: user.email, role: user.role };
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
