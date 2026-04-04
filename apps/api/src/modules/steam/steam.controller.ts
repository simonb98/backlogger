import { Controller, Post, Get, Body, Query, Res, UseGuards, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { SteamService } from './steam.service';
import { SteamImportService, ImportResult } from './steam-import.service';
import { SteamAchievementService } from './steam-achievement.service';
import { SteamImportDto } from './dto/steam-import.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@ApiTags('Steam')
@ApiBearerAuth()
@Controller('steam')
export class SteamController {
  constructor(
    private readonly steamService: SteamService,
    private readonly steamImportService: SteamImportService,
    private readonly steamAchievementService: SteamAchievementService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get Steam profile info' })
  async getProfile(@Query('steamId') steamId: string) {
    const resolvedId = await this.steamService.getSteamIdFromInput(steamId);
    const profile = await this.steamService.getProfile(resolvedId);
    const games = await this.steamService.getOwnedGames(resolvedId);

    return {
      profile: {
        steamId: profile.steamid,
        name: profile.personaname,
        avatar: profile.avatarfull,
        profileUrl: profile.profileurl,
      },
      gameCount: games.length,
      totalPlaytimeHours: Math.round(
        games.reduce((acc, g) => acc + g.playtime_forever, 0) / 60
      ),
    };
  }

  @Post('import')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Import games from Steam library' })
  @ApiResponse({ status: 201, description: 'Import completed' })
  async importGames(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SteamImportDto,
  ): Promise<ImportResult> {
    return this.steamImportService.importFromSteam(user.id, dto.steamId);
  }

  @Get('import-stream')
  @ApiOperation({ summary: 'Import games from Steam with SSE progress updates' })
  async importGamesStream(
    @Query('steamId') steamId: string,
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendEvent = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    // Verify JWT token from query parameter (EventSource can't send headers)
    let userId: number;
    try {
      const payload = this.jwtService.verify(token);
      userId = payload.sub;
    } catch {
      sendEvent('error', { message: 'Unauthorized' });
      res.end();
      return;
    }

    try {
      await this.steamImportService.importFromSteamWithProgress(
        userId,
        steamId,
        (progress) => sendEvent('progress', progress),
      );
    } catch (error) {
      sendEvent('error', {
        message: error instanceof Error ? error.message : 'Import failed'
      });
    }

    res.end();
  }

  @Get('achievements/:userGameId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get achievements for a game' })
  async getAchievements(
    @CurrentUser() user: CurrentUserPayload,
    @Param('userGameId', ParseIntPipe) userGameId: number,
  ) {
    return this.steamAchievementService.getAchievements(userGameId, user.id);
  }

  @Post('achievements/:userGameId/sync')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Sync achievements from Steam' })
  async syncAchievements(
    @CurrentUser() user: CurrentUserPayload,
    @Param('userGameId', ParseIntPipe) userGameId: number,
  ) {
    return this.steamAchievementService.syncAchievements(userGameId, user.id);
  }

  @Get('achievements/:userGameId/stats')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get achievement stats for a game' })
  async getAchievementStats(
    @Param('userGameId', ParseIntPipe) userGameId: number,
  ) {
    return this.steamAchievementService.getAchievementStats(userGameId);
  }

  @Post('backfill-app-ids')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Backfill Steam App IDs for existing games' })
  async backfillAppIds(@CurrentUser() user: CurrentUserPayload) {
    return this.steamImportService.backfillSteamAppIds(user.id);
  }

  @Post('achievements/sync-all')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Sync achievements for all Steam games' })
  async syncAllAchievements(@CurrentUser() user: CurrentUserPayload) {
    return this.steamAchievementService.syncAllAchievements(user.id);
  }

  @Post('sync-dates/:userGameId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Sync started/completed dates from Steam achievements' })
  async syncDates(
    @CurrentUser() user: CurrentUserPayload,
    @Param('userGameId', ParseIntPipe) userGameId: number,
  ) {
    return this.steamAchievementService.syncDatesFromAchievements(userGameId, user.id);
  }
}

