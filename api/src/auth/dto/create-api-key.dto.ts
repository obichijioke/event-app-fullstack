import { IsString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApiKeyDto {
  @ApiProperty({ description: 'Name for the API key' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Scopes/permissions for the API key',
    required: false,
    type: [String],
  })
  @IsArray()
  @IsOptional()
  scopes?: string[];
}
