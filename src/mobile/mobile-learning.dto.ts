import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class SourceAnswerDto {
  @IsString() @MaxLength(200) id!: string;
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(20, { each: true })
  answers!: string[];
}
export class SourceAttemptDto {
  @IsUUID() clientRequestId!: string;
  @IsString() @MaxLength(200) bankId!: string;
  @IsString() @MaxLength(64) version!: string;
  @IsIn(['practice', 'exam']) mode!: 'practice' | 'exam';
  @IsInt() @Min(0) @Max(21600) seconds!: number;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => SourceAnswerDto)
  answers!: SourceAnswerDto[];
}
class ChatTurnDto {
  @IsIn(['user', 'bot']) role!: 'user' | 'bot';
  @IsString() @MaxLength(2000) text!: string;
}
export class MobileChatDto {
  @IsString() @MaxLength(500) question!: string;
  @IsIn(['vi', 'en']) locale!: 'vi' | 'en';
  @IsArray()
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => ChatTurnDto)
  history!: ChatTurnDto[];
}
