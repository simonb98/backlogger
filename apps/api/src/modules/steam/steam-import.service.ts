import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SteamService, SteamGame } from './steam.service';
import { IgdbService } from '../igdb/igdb.service';
import { Game, UserGame, Platform } from '../../database/entities';

export interface ImportResult {
  imported: number;
  skipped: number;
  failed: number;
  games: {
    name: string;
    status: 'imported' | 'skipped' | 'failed';
    reason?: string;
  }[];
}

@Injectable()
export class SteamImportService {
  private readonly logger = new Logger(SteamImportService.name);

  constructor(
    private steamService: SteamService,
    private igdbService: IgdbService,
    @InjectRepository(Game) private gameRepository: Repository<Game>,
    @InjectRepository(UserGame) private userGameRepository: Repository<UserGame>,
    @InjectRepository(Platform) private platformRepository: Repository<Platform>,
  ) {}

  async importFromSteam(steamInput: string): Promise<ImportResult> {
    const steamId = await this.steamService.getSteamIdFromInput(steamInput);
    const steamGames = await this.steamService.getOwnedGames(steamId);

    // Get PC platform
    const pcPlatform = await this.platformRepository.findOne({
      where: { abbreviation: 'PC' },
    });
    if (!pcPlatform) {
      throw new Error('PC platform not found');
    }

    const result: ImportResult = { imported: 0, skipped: 0, failed: 0, games: [] };

    for (const steamGame of steamGames) {
      try {
        const importStatus = await this.importSingleGame(steamGame, pcPlatform);
        result.games.push({ name: steamGame.name, ...importStatus });

        if (importStatus.status === 'imported') result.imported++;
        else if (importStatus.status === 'skipped') result.skipped++;
        else result.failed++;
      } catch (error) {
        result.failed++;
        result.games.push({
          name: steamGame.name,
          status: 'failed',
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  }

  private async importSingleGame(
    steamGame: SteamGame,
    platform: Platform,
  ): Promise<{ status: 'imported' | 'skipped' | 'failed'; reason?: string }> {
    // Search IGDB for this game
    const igdbResults = await this.igdbService.search(steamGame.name, 5);

    if (igdbResults.length === 0) {
      return { status: 'failed', reason: 'Not found on IGDB' };
    }

    // Find best match (exact name match or first result)
    const exactMatch = igdbResults.find(
      (g) => g.name.toLowerCase() === steamGame.name.toLowerCase()
    );
    const igdbGame = exactMatch || igdbResults[0];

    // Check if game already exists in our DB
    let game = await this.gameRepository.findOne({
      where: { igdbId: igdbGame.id },
    });

    if (!game) {
      // Fetch full game details from IGDB
      const fullGame = await this.igdbService.getGame(igdbGame.id);
      if (!fullGame) {
        return { status: 'failed', reason: 'Could not fetch IGDB details' };
      }

      const developer = fullGame.involved_companies?.find((ic) => ic.developer)?.company.name;
      const publisher = fullGame.involved_companies?.find((ic) => ic.publisher)?.company.name;

      game = this.gameRepository.create({
        igdbId: fullGame.id,
        name: fullGame.name,
        slug: fullGame.slug,
        summary: fullGame.summary,
        coverUrl: fullGame.cover ? this.igdbService.getCoverUrl(fullGame.cover.image_id) : undefined,
        releaseDate: fullGame.first_release_date
          ? new Date(fullGame.first_release_date * 1000)
          : undefined,
        genres: fullGame.genres?.map((g) => g.name),
        developer,
        publisher,
        igdbRating: fullGame.total_rating,
      });
      game = await this.gameRepository.save(game);
    }

    // Check if already in library
    const existing = await this.userGameRepository.findOne({
      where: { gameId: game.id, platformId: platform.id },
    });

    if (existing) {
      // Update playtime if Steam has more
      if (steamGame.playtime_forever > existing.totalPlaytimeMins) {
        existing.totalPlaytimeMins = steamGame.playtime_forever;
        await this.userGameRepository.save(existing);
        return { status: 'skipped', reason: 'Already in library (playtime updated)' };
      }
      return { status: 'skipped', reason: 'Already in library' };
    }

    // Create user game entry
    const userGame = this.userGameRepository.create({
      gameId: game.id,
      platformId: platform.id,
      status: steamGame.playtime_forever > 0 ? 'playing' : 'backlog',
      totalPlaytimeMins: steamGame.playtime_forever,
    });
    await this.userGameRepository.save(userGame);

    return { status: 'imported' };
  }
}

