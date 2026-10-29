import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Headers,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { ChangePasswordDto } from '../auth/dto/change-password.dto';
import { MembershipService } from '../membership/membership.service';
const tokenOf = (value?: string) =>
  value?.startsWith('Bearer ') ? value.slice(7) : undefined;

@ApiTags('mobile-account')
@ApiBearerAuth()
@Controller('mobile/account')
export class MobileAccountController {
  constructor(
    private readonly auth: AuthService,
    private readonly membership: MembershipService,
  ) {}
  @Get()
  @Header('Cache-Control', 'private, no-store')
  async overview(@Headers('authorization') authorization?: string) {
    const { user } = await this.auth.me(tokenOf(authorization));
    const membership = await this.membership.status(user.id);
    // Payment reconciliation may activate Premium after the profile was read.
    return {
      user: {
        ...user,
        plan: membership.plan,
        premiumUntil: membership.premiumUntil,
      },
      membership,
    };
  }
  @Get('sessions')
  @Header('Cache-Control', 'private, no-store')
  sessions(@Headers('authorization') authorization?: string) {
    return this.auth.sessions(tokenOf(authorization));
  }
  @Delete('sessions/others')
  others(@Headers('authorization') authorization?: string) {
    return this.auth.revokeOtherSessions(tokenOf(authorization));
  }
  @Delete('sessions/:id')
  revoke(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    return this.auth.revokeSession(id, tokenOf(authorization));
  }
  @Delete('connections/:provider')
  unlink(
    @Param('provider') provider: string,
    @Headers('authorization') authorization?: string,
  ) {
    if (!['google', 'github', 'facebook'].includes(provider))
      throw new BadRequestException('Nhà cung cấp không hợp lệ');
    return this.auth.unlinkProvider(
      provider as 'google' | 'github' | 'facebook',
      tokenOf(authorization),
    );
  }
  @Post('password')
  @HttpCode(200)
  @Header('Cache-Control', 'private, no-store')
  password(
    @Body() dto: ChangePasswordDto,
    @Headers('authorization') authorization?: string,
    @Headers('user-agent') agent?: string,
  ) {
    return this.auth.changePassword(dto, tokenOf(authorization), agent);
  }
}
