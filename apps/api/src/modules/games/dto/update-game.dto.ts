import { IsInt, IsOptional, IsString, IsIn, Min, Max, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type { GameStatus } from '../../../database/entities';

const GAME_STATUSES: GameStatus[] = ['backlog', 'up_next', 'playing', 'completed', 'dropped', 'wishlist', 'on_hold'];

export class UpdateGameDto {
  @ApiPropertyOptional({ description: 'Game status', enum: GAME_STATUSES })
  @IsOptional()
  @IsString()
  @IsIn(GAME_STATUSES)
  status?: GameStatus;

  @ApiPropertyOptional({ description: 'Personal rating (1-10), null to clear' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  rating?: number | null;

  @ApiPropertyOptional({ description: 'Personal notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Personal review' })
  @IsOptional()
  @IsString()
  review?: string;

  @ApiPropertyOptional({ description: 'Completion percentage (0-100)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  completionPercent?: number;

  @ApiPropertyOptional({ description: 'Date started playing' })
  @IsOptional()
  @IsDateString()
  dateStarted?: string;

  @ApiPropertyOptional({ description: 'Date completed' })
  @IsOptional()
  @IsDateString()
  dateCompleted?: string;

  @ApiPropertyOptional({ description: 'Platform ID' })
  @IsOptional()
  @IsInt()
  platformId?: number;

  @ApiPropertyOptional({ description: 'Skipped until date (for Discover feature)' })
  @IsOptional()
  @IsDateString()
  skippedUntil?: string | null;
}

