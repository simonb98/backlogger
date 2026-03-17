import { Controller, Post, Get, Body, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { SteamService } from './steam.service';
import { SteamImportService, ImportResult } from './steam-import.service';
import { SteamImportDto } from './dto/steam-import.dto';

@ApiTags('Steam')
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
  async importGames(@Body() dto: SteamImportDto): Promise<ImportResult> {
    return this.steamImportService.importFromSteam(dto.steamId);
  }

  @Get('import-stream')
  @ApiOperation({ summary: 'Import games from Steam with SSE progress updates' })
  async importGamesStream(
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

