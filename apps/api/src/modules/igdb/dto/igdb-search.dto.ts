import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class IgdbSearchDto {
  @ApiProperty({ description: 'Search query' })
  @IsString()
  q: string;

  @ApiPropertyOptional({ description: 'Number of results to return', default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 20;
}

export class IgdbSearchResultDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  slug?: string;

  @ApiPropertyOptional()
  coverUrl?: string;

  @ApiPropertyOptional()
  releaseYear?: number;

  @ApiPropertyOptional()
  platforms?: string[];

  @ApiPropertyOptional()
  rating?: number;
}

