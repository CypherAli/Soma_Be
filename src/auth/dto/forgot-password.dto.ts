import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'student@soma3d.vn' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;
}
