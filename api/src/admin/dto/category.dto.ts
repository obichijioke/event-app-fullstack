import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Category name', example: 'Music' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiProperty({ description: 'URL-friendly slug', example: 'music' })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase letters, numbers, and hyphens only',
  })
  slug: string;

  @ApiProperty({
    description: 'Parent category ID',
    example: 'clx123...',
    required: false,
  })
  @IsString()
  @IsOptional()
  parentId?: string;
}

export class UpdateCategoryDto {
  @ApiProperty({
    description: 'Category name',
    example: 'Music',
    required: false,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'URL-friendly slug',
    example: 'music',
    required: false,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase letters, numbers, and hyphens only',
  })
  @IsOptional()
  slug?: string;

  @ApiProperty({
    description: 'Parent category ID',
    example: 'clx123...',
    required: false,
  })
  @IsString()
  @IsOptional()
  parentId?: string | null;
}

export class CategoryQueryDto {
  @ApiProperty({ description: 'Search term', required: false })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Include parent categories only',
    required: false,
  })
  @IsOptional()
  parentOnly?: boolean;
}
