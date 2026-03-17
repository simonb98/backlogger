import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SteamService, SteamGame } from './steam.service';
import { IgdbService } from '../igdb/igdb.service';
import { Game, UserGame, Platform, User } from '../../database/entities';

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

export interface ImportProgress {
  current: number;
  total: number;
  gameName: string;
  status: 'imported' | 'skipped' | 'failed' | 'processing';
  reason?: string;
  done: boolean;
  result?: ImportResult;
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
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async importFromSteam(userId: number, steamInput: string): Promise<ImportResult> {
    return this.importFromSteamWithProgress(userId, steamInput);
  }

  async importFromSteamWithProgress(
    userId: number,
    steamInput: string,
    onProgress?: (progress: ImportProgress) => void,
  ): Promise<ImportResult> {
    const steamId = await this.steamService.getSteamIdFromInput(steamInput);
    const steamGames = await this.steamService.getOwnedGames(steamId);

    // Link Steam ID to user if not already linked
    await this.linkSteamToUser(userId, steamId);

    // Get PC platform
    const pcPlatform = await this.platformRepository.findOne({
      where: { abbreviation: 'PC' },
    });
    if (!pcPlatform) {
      throw new Error('PC platform not found');
    }

    const result: ImportResult = { imported: 0, skipped: 0, failed: 0, games: [] };
    const total = steamGames.length;

    for (let i = 0; i < steamGames.length; i++) {
      const steamGame = steamGames[i];

      // Send processing event
      onProgress?.({
        current: i + 1,
        total,
        gameName: steamGame.name,
        status: 'processing',
        done: false,
      });

      try {
        const importStatus = await this.importSingleGame(userId, steamGame, pcPlatform);
        result.games.push({ name: steamGame.name, ...importStatus });

        if (importStatus.status === 'imported') result.imported++;
        else if (importStatus.status === 'skipped') result.skipped++;
        else result.failed++;

        // Send status update
        onProgress?.({
          current: i + 1,
          total,
          gameName: steamGame.name,
          status: importStatus.status,
          reason: importStatus.reason,
          done: false,
        });
      } catch (error) {
        result.failed++;
        const reason = error instanceof Error ? error.message : 'Unknown error';
        result.games.push({
          name: steamGame.name,
          status: 'failed',
          reason,
        });

        onProgress?.({
          current: i + 1,
          total,
          gameName: steamGame.name,
          status: 'failed',
          reason,
          done: false,
        });
      }
    }

    // Send final result
    onProgress?.({
      current: total,
      total,
      gameName: '',
      status: 'imported',
      done: true,
      result,
    });

    return result;
  }

  private async importSingleGame(
    userId: number,
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

    // Check if already in library for this user
    const existing = await this.userGameRepository.findOne({
      where: { userId, gameId: game.id, platformId: platform.id },
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
      userId,
      gameId: game.id,
      platformId: platform.id,
      status: 'backlog',
      totalPlaytimeMins: steamGame.playtime_forever,
    });
    await this.userGameRepository.save(userGame);

    return { status: 'imported' };
  }

  private async linkSteamToUser(userId: number, steamId: string): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (user && !user.steamId) {
        // Check if this Steam ID is already linked to another user
        const existingUser = await this.userRepository.findOne({ where: { steamId } });
        if (!existingUser) {
          // Get Steam profile for avatar
          const profile = await this.steamService.getProfile(steamId);
          user.steamId = steamId;
          user.steamAvatar = profile?.avatarfull;
          await this.userRepository.save(user);
          this.logger.log(`Linked Steam ID ${steamId} to user ${userId}`);
        }
      }
    } catch (error) {
      // Non-critical, just log and continue
      this.logger.warn(`Failed to link Steam ID to user: ${error}`);
    }
  }
}

