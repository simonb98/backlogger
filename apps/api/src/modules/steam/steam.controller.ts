import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
}

