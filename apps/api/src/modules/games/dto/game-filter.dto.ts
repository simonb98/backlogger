import { IsOptional, IsString, IsInt, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type { GameStatus } from '../../../database/entities';

const GAME_STATUSES: GameStatus[] = ['backlog', 'up_next', 'playing', 'completed', 'dropped', 'wishlist', 'on_hold'];
const SORT_FIELDS = ['name', 'date_added', 'rating', 'playtime', 'release_date'] as const;
const SORT_ORDERS = ['asc', 'desc'] as const;

export class GameFilterDto {
  @ApiPropertyOptional({ description: 'Filter by status', enum: GAME_STATUSES })
  @IsOptional()
  @IsString()
  @IsIn(GAME_STATUSES)
  status?: GameStatus;

  @ApiPropertyOptional({ description: 'Filter by platform ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  platform?: number;

  @ApiPropertyOptional({ description: 'Filter by genre' })
  @IsOptional()
  @IsString()
  genre?: string;

  @ApiPropertyOptional({ description: 'Filter by custom tag ID' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  tag?: number;

  @ApiPropertyOptional({ description: 'Minimum rating' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  minRating?: number;

  @ApiPropertyOptional({ description: 'Maximum rating' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  @Type(() => Number)
  maxRating?: number;

  @ApiPropertyOptional({ description: 'Search by name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Sort field', enum: SORT_FIELDS })
  @IsOptional()
  @IsIn(SORT_FIELDS)
  sortBy?: (typeof SORT_FIELDS)[number] = 'date_added';

  @ApiPropertyOptional({ description: 'Sort order', enum: SORT_ORDERS })
  @IsOptional()
  @IsIn(SORT_ORDERS)
  sortOrder?: (typeof SORT_ORDERS)[number] = 'desc';

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}

