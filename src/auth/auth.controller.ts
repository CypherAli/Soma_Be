import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Query,
  Redirect,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register') register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @HttpCode(200)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
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
  ) {
    return this.authService.changePassword(dto, this.bearerToken(value));
  }

  @ApiBearerAuth()
  @HttpCode(200)
  @Post('logout')
  logout(@Headers('authorization') value?: string) {
    return this.authService.logout(this.bearerToken(value));
  }

  @Get('oauth/:provider')
  @Redirect()
  async oauth(@Param('provider') provider: 'google' | 'github' | 'facebook') {
    return { url: await this.authService.oauthUrl(provider) };
  }

  @Get('oauth/:provider/callback')
  @Redirect()
  async oauthCallback(
    @Param('provider') provider: 'google' | 'github' | 'facebook',
    @Query('code') code: string,
    @Query('state') state: string,
  ) {
    const result = await this.authService.oauthCallback(provider, code, state);
    const frontend = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    return {
      url: `${frontend}/oauth-callback#token=${encodeURIComponent(result.token)}&expiresAt=${encodeURIComponent(result.expiresAt.toISOString())}&user=${encodeURIComponent(JSON.stringify(result.user))}`,
    };
  }

  private bearerToken(value?: string) {
    return value?.startsWith('Bearer ') ? value.slice(7) : undefined;
  }
}
