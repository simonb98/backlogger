import { IsInt, IsOptional, IsString, IsIn, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { GameStatus } from '../../../database/entities';

const GAME_STATUSES: GameStatus[] = ['backlog', 'up_next', 'playing', 'completed', 'dropped', 'wishlist', 'on_hold'];

export class CreateGameDto {
  @ApiProperty({ description: 'IGDB game ID' })
  @IsInt()
  igdbId: number;

  @ApiProperty({ description: 'Platform ID' })
  @IsInt()
  platformId: number;

  @ApiPropertyOptional({ description: 'Game status', enum: GAME_STATUSES, default: 'backlog' })
  @IsOptional()
  @IsString()
  @IsIn(GAME_STATUSES)
  status?: GameStatus = 'backlog';

  @ApiPropertyOptional({ description: 'Personal rating (1-10)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  rating?: number;

  @ApiPropertyOptional({ description: 'Personal notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

