import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class MobileOAuthStartDto {
  @IsOptional()
  @IsString()
  @MaxLength(512)
  returnUrl?: string;

  @IsString()
  @Matches(/^[A-Za-z0-9_-]{43}$/)
  challenge: string;

  @IsString()
  @Matches(/^[A-Za-z0-9_-]{32,128}$/)
  state: string;
}

export class MobileOAuthExchangeDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{43}$/)
  code: string;

  @IsString()
  @Matches(/^[A-Za-z0-9._~-]{43,128}$/)
  verifier: string;
}
