import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/roles';
import { MembershipService } from './membership.service';

@ApiTags('membership')
@Controller('membership')
export class MembershipController {
  constructor(private readonly membership: MembershipService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Monthly quota, current plan and payment availability',
  })
  status(@CurrentUser() user: AuthUser) {
    return this.membership.status(user.id);
  }

  @Post('consume')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Atomically consume one monthly assistant question',
  })
  consume(@CurrentUser() user: AuthUser) {
    return this.membership.consume(user.id);
  }

  @Post('checkout')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create or resume a 25,000 VND Premium order' })
  checkout(@CurrentUser() user: AuthUser) {
    return this.membership.checkout(user.id);
  }

  @Get('orders/:id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  order(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.membership.order(user.id, id);
  }

  @Post('sepay/webhook')
  @HttpCode(200)
  @ApiOperation({
    summary: 'SePay bank-transfer callback, authenticated by webhook API key',
  })
  webhook(
    @Headers('authorization') authorization: string | undefined,
    @Body() payload: unknown,
  ) {
    return this.membership.webhook(authorization, payload);
  }

  @Post('sepay/ipn')
  @HttpCode(200)
  @ApiOperation({
    summary:
      'SePay Payment Gateway IPN, verified against the authenticated order API',
  })
  ipn(
    @Headers('x-secret-key') secret: string | undefined,
    @Body() payload: unknown,
  ) {
    return this.membership.ipn(secret, payload);
  }

  @Post('orders/:id/simulate')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Simulate own pending SePay Sandbox order; unavailable for live payments',
  })
  simulate(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.membership.simulate(user.id, id);
  }
}
