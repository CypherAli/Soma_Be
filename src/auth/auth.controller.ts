import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Ip,
  Param,
  Patch,
  Post,
  Query,
  Redirect,
  HttpException,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  MobileOAuthStartDto,
  MobileOAuthExchangeDto,
} from './dto/mobile-oauth.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  checkLoginThrottle,
  loginKey,
  recordLoginFail,
  recordLoginSuccess,
} from './login-throttle';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('capabilities')
  capabilities() {
    return this.authService.capabilities();
  }

  @Get('mobile/capabilities')
  mobileCapabilities(@Query('returnUrl') returnUrl?: string) {
    return this.authService.mobileCapabilities(returnUrl);
  }

  @Post('register') register(
    @Body() dto: RegisterDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.register(dto, userAgent);
  }

  @HttpCode(200)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Headers('user-agent') userAgent?: string,
    @Ip() ip?: string,
  ) {
    const key = loginKey(dto.email, ip);
    const check = checkLoginThrottle(key);
    if (check.blocked) {
      throw new HttpException(
        `Sai quá nhiều lần, thử lại sau ${Math.ceil(check.retryAfterSec / 60)} phút`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    try {
      const result = await this.authService.login(dto, userAgent);
      recordLoginSuccess(key);
      return result;
    } catch (error) {
      if (error instanceof UnauthorizedException) recordLoginFail(key);
      throw error;
    }
  }

  @HttpCode(200)
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @HttpCode(200)
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @ApiBearerAuth()
  @Get('me')
  me(@Headers('authorization') value?: string) {
    return this.authService.me(this.bearerToken(value));
  }

  @ApiBearerAuth()
  @HttpCode(200)
  @Post('change-password')
  changePassword(
    @Body() dto: ChangePasswordDto,
    @Headers('authorization') value?: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.changePassword(
      dto,
      this.bearerToken(value),
      userAgent,
    );
  }

  @ApiBearerAuth()
  @Patch('profile')
  updateProfile(
    @Body() dto: UpdateProfileDto,
    @Headers('authorization') value?: string,
  ) {
    return this.authService.updateProfile(dto, this.bearerToken(value));
  }

  @ApiBearerAuth()
  @Get('sessions')
  sessions(@Headers('authorization') value?: string) {
    return this.authService.sessions(this.bearerToken(value));
  }

  @ApiBearerAuth()
  @Delete('sessions/others')
  revokeOtherSessions(@Headers('authorization') value?: string) {
    return this.authService.revokeOtherSessions(this.bearerToken(value));
  }

  @ApiBearerAuth()
  @Delete('sessions/:id')
  revokeSession(
    @Param('id') id: string,
    @Headers('authorization') value?: string,
  ) {
    return this.authService.revokeSession(id, this.bearerToken(value));
  }

  @ApiBearerAuth()
  @Delete('connections/:provider')
  unlink(
    @Param('provider') provider: 'google' | 'github' | 'facebook',
    @Headers('authorization') value?: string,
  ) {
    return this.authService.unlinkProvider(provider, this.bearerToken(value));
  }

  @ApiBearerAuth()
  @HttpCode(200)
  @Post('logout')
  logout(@Headers('authorization') value?: string) {
    return this.authService.logout(this.bearerToken(value));
  }

  /** `link` = token phiên hiện tại: gắn thêm cách đăng nhập thay vì đăng nhập mới. */
  @Post('mobile/oauth/:provider/link')
  @ApiBearerAuth()
  @HttpCode(200)
  async mobileOAuthLink(
    @Param('provider') provider: 'google' | 'github' | 'facebook',
    @Body() dto: MobileOAuthStartDto,
    @Headers('authorization') authorization?: string,
  ) {
    const token = this.bearerToken(authorization);
    if (!token) throw new UnauthorizedException('Cần đăng nhập');
    return { url: await this.authService.oauthUrl(provider, token, dto) };
  }

  @Post('mobile/oauth/:provider')
  @HttpCode(200)
  async mobileOAuthStart(
    @Param('provider') provider: 'google' | 'github' | 'facebook',
    @Body() dto: MobileOAuthStartDto,
  ) {
    return { url: await this.authService.oauthUrl(provider, undefined, dto) };
  }

  @Post('mobile/exchange')
  @HttpCode(200)
  mobileOAuthExchange(
    @Body() dto: MobileOAuthExchangeDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.exchangeMobileOAuth(
      dto.code,
      dto.verifier,
      userAgent,
    );
  }

  @Get('oauth/:provider')
  @Redirect()
  async oauth(
    @Param('provider') provider: 'google' | 'github' | 'facebook',
    @Query('link') link?: string,
  ) {
    if (link !== undefined)
      throw new BadRequestException(
        'Dùng POST /auth/oauth/:provider/link với Bearer header để liên kết tài khoản.',
      );
    return { url: await this.authService.oauthUrl(provider) };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bắt đầu liên kết OAuth bằng phiên đã xác thực' })
  @HttpCode(200)
  @Post('oauth/:provider/link')
  async beginOAuthLink(
    @Param('provider') provider: 'google' | 'github' | 'facebook',
    @Headers('authorization') value?: string,
  ) {
    const token = this.bearerToken(value);
    if (!token) throw new UnauthorizedException('Cần đăng nhập');
    return { url: await this.authService.oauthUrl(provider, token) };
  }

  @Get('oauth/:provider/callback')
  @Redirect()
  async oauthCallback(
    @Param('provider') provider: 'google' | 'github' | 'facebook',
    @Query('code') code: string,
    @Query('state') state: string,
    @Headers('user-agent') userAgent?: string,
    @Query('error') providerError?: string,
  ) {
    const mobile = await this.authService.mobileOAuthContext(provider, state);
    let result: Awaited<ReturnType<AuthService['oauthCallback']>>;
    try {
      if (providerError || !code)
        throw new UnauthorizedException('Đăng nhập bị hủy.');
      result = await this.authService.oauthCallback(
        provider,
        code,
        state,
        userAgent,
      );
    } catch (error) {
      if (!mobile) throw error;
      await this.authService.discardOAuthState(mobile.id);
      return {
        url: `${mobile.returnUrl}?${new URLSearchParams({ state: mobile.state, error: providerError === 'access_denied' ? 'cancelled' : 'failed' })}`,
      };
    }
    if ('mobileCode' in result) {
      return {
        url: `${mobile?.returnUrl || 'soma://oauth'}?${new URLSearchParams({ code: result.mobileCode, state: result.mobileState })}`,
      };
    }
    const frontend = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    // Luồng liên kết KHÔNG cấp phiên mới: người dùng đã đăng nhập sẵn, đưa họ
    // về đúng trang Kết nối là xong.
    if (!('token' in result)) {
      return { url: `${frontend}/cai-dat/ket-noi?linked=${result.linked}` };
    }
    return {
      url: `${frontend}/oauth-callback#token=${encodeURIComponent(result.token)}&expiresAt=${encodeURIComponent(result.expiresAt.toISOString())}&user=${encodeURIComponent(JSON.stringify(result.user))}`,
    };
  }

  private bearerToken(value?: string) {
    return value?.startsWith('Bearer ') ? value.slice(7) : undefined;
  }
}
