import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
export class CreateSourceDto {
  @IsString() @MaxLength(500) title!: string;
  @IsString() @MaxLength(300) publisher!: string;
  @IsOptional() @IsInt() @Min(1000) @Max(3000) year?: number;
  @IsOptional() @IsString() @MaxLength(2000) url?: string;
  @IsOptional() @IsString() @MaxLength(5000) licenseNote?: string;
  @IsOptional() @IsString() replaceId?: string;
  @IsOptional() @IsString() expectedRevision?: string;
}
