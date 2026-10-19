import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsObject,
  IsString,
  MaxLength,
  Min,
  IsOptional,
  IsIn,
} from 'class-validator';

export class ContentLibraryQueryDto {
  @ApiProperty({ required: false, default: '', description: 'Filename filter' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q: string = '';
  @ApiProperty({ required: false, default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page: number = 1;
  @ApiProperty({ required: false, enum: ['', 'image', 'model'] })
  @IsOptional()
  @IsIn(['', 'image', 'model'])
  kind: string = '';
}

export class SaveSiteContentDto {
  @ApiProperty({
    description: 'Version last read; 0 for untouched source content',
  })
  @IsInt()
  @Min(0)
  version: number;

  @ApiProperty({
    type: Object,
    description:
      'Complete content document, validated against its source schema',
  })
  @IsObject()
  payload: Record<string, unknown>;
}

export class ContentVersionDto {
  @ApiProperty()
  @IsInt()
  @Min(0)
  version: number;
}

export class RestoreContentDto extends ContentVersionDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  revisionId: string;
}
