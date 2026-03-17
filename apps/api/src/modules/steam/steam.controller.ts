import { Controller, Post, Get, Body, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { SteamService } from './steam.service';
import { SteamImportService, ImportResult } from './steam-import.service';
import { SteamImportDto } from './dto/steam-import.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@ApiTags('Steam')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('steam')
export class SteamController {
  constructor(
    private readonly steamService: SteamService,
    private readonly steamImportService: SteamImportService,
  ) {}

  @Get('profile')
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
    @CurrentUser() user: CurrentUserPayload,
    @Query('steamId') steamId: string,
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

    try {
      await this.steamImportService.importFromSteamWithProgress(
        user.id,
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
}

