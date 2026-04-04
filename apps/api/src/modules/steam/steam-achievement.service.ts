import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SteamService } from './steam.service';
import { Achievement, UserGame, User } from '../../database/entities';

@Injectable()
export class SteamAchievementService {
  private readonly logger = new Logger(SteamAchievementService.name);

  constructor(
    private steamService: SteamService,
    @InjectRepository(Achievement) private achievementRepository: Repository<Achievement>,
    @InjectRepository(UserGame) private userGameRepository: Repository<UserGame>,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async syncAchievements(userGameId: number, userId: number): Promise<Achievement[]> {
    const userGame = await this.userGameRepository.findOne({
      where: { id: userGameId, userId },
      relations: ['user'],
    });

    if (!userGame) {
      throw new Error('Game not found in library');
    }

    if (!userGame.steamAppId) {
      throw new Error('Game has no Steam App ID');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user?.steamId) {
      throw new Error('User has no Steam ID linked');
    }

    const steamAchievements = await this.steamService.getFullAchievements(
      user.steamId,
      userGame.steamAppId
    );

    if (steamAchievements.length === 0) {
      return [];
    }

    // Delete existing achievements for this game
    await this.achievementRepository.delete({ userGameId });

    // Insert new achievements
    const achievementEntities: Achievement[] = [];
    for (const a of steamAchievements) {
      const achievement = new Achievement();
      achievement.userGameId = userGameId;
      achievement.apiName = a.apiName;
      achievement.name = a.name;
      achievement.description = a.description || '';
      achievement.iconUrl = a.iconUrl;
      achievement.iconGrayUrl = a.iconGrayUrl;
      achievement.achieved = a.achieved;
      achievement.unlockTime = a.unlockTime ?? undefined;
      achievement.globalPercent = a.globalPercent ?? undefined;
      achievementEntities.push(achievement);
    }

    await this.achievementRepository.save(achievementEntities);

    // Sync dates from achievement unlock times
    let gameUpdated = false;
    const unlockedAchievements = achievementEntities.filter(a => a.achieved && a.unlockTime);

    // Set dateStarted from earliest achievement unlock time (if not already set)
    if (!userGame.dateStarted && unlockedAchievements.length > 0) {
      const earliestUnlock = unlockedAchievements
        .sort((a, b) => (a.unlockTime?.getTime() || 0) - (b.unlockTime?.getTime() || 0))[0];
      if (earliestUnlock?.unlockTime) {
        userGame.dateStarted = earliestUnlock.unlockTime;
        gameUpdated = true;
        this.logger.log(`Set dateStarted for game ${userGameId} from earliest achievement: ${earliestUnlock.unlockTime}`);
      }
    }

    // Auto-set status to completed if all achievements are unlocked
    const unlockedCount = achievementEntities.filter(a => a.achieved).length;
    if (achievementEntities.length > 0 && unlockedCount === achievementEntities.length) {
      userGame.status = 'completed';
      if (!userGame.dateCompleted) {
        // Set completion date to latest unlock time
        const latestUnlock = unlockedAchievements
          .sort((a, b) => (b.unlockTime?.getTime() || 0) - (a.unlockTime?.getTime() || 0))[0];
        userGame.dateCompleted = latestUnlock?.unlockTime || new Date();
        gameUpdated = true;
      }
      this.logger.log(`Auto-set game ${userGameId} to completed (100% achievements)`);
    }

    if (gameUpdated) {
      await this.userGameRepository.save(userGame);
    }

    this.logger.log(`Synced ${achievementEntities.length} achievements for userGame ${userGameId}`);
    return achievementEntities;
  }

  async getAchievements(userGameId: number, userId: number): Promise<Achievement[]> {
    const userGame = await this.userGameRepository.findOne({
      where: { id: userGameId, userId },
    });

    if (!userGame) {
      throw new Error('Game not found in library');
    }

    return this.achievementRepository.find({
      where: { userGameId },
      order: { globalPercent: 'DESC' },
    });
  }

  async getAchievementStats(userGameId: number): Promise<{ total: number; unlocked: number; percent: number }> {
    const achievements = await this.achievementRepository.find({ where: { userGameId } });
    const total = achievements.length;
    const unlocked = achievements.filter(a => a.achieved).length;
    return {
      total,
      unlocked,
      percent: total > 0 ? Math.round((unlocked / total) * 100) : 0,
    };
  }

  async syncAllAchievements(userId: number): Promise<{ synced: number; failed: number; completed: number }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user?.steamId) {
      throw new Error('User has no Steam ID linked');
    }

    // Get all user games with Steam App IDs
    const userGames = await this.userGameRepository.find({
      where: { userId },
    });

    const gamesWithSteamId = userGames.filter(g => g.steamAppId);

    let synced = 0;
    let failed = 0;
    let completed = 0;

    for (const userGame of gamesWithSteamId) {
      try {
        const achievements = await this.syncAchievements(userGame.id, userId);
        if (achievements.length > 0) {
          synced++;
          // Check if game was auto-completed
          const allUnlocked = achievements.every(a => a.achieved);
          if (allUnlocked) {
            completed++;
          }
        }
      } catch (error) {
        this.logger.debug(`Failed to sync achievements for game ${userGame.id}: ${error.message}`);
        failed++;
      }
    }

    this.logger.log(`Synced achievements for ${synced} games, ${failed} failed, ${completed} auto-completed`);
    return { synced, failed, completed };
  }

  async syncDatesFromAchievements(
    userGameId: number,
    userId: number,
  ): Promise<{ dateStarted?: Date; dateCompleted?: Date; updated: boolean }> {
    const userGame = await this.userGameRepository.findOne({
      where: { id: userGameId, userId },
    });

    if (!userGame) {
      throw new Error('Game not found in library');
    }

    // Get existing achievements
    const achievements = await this.achievementRepository.find({
      where: { userGameId },
    });

    if (achievements.length === 0) {
      return { updated: false };
    }

    const unlockedAchievements = achievements.filter(a => a.achieved && a.unlockTime);

    if (unlockedAchievements.length === 0) {
      return { updated: false };
    }

    let updated = false;
    let dateStarted: Date | undefined;
    let dateCompleted: Date | undefined;

    // Set dateStarted from earliest achievement unlock time
    const earliestUnlock = unlockedAchievements
      .sort((a, b) => (a.unlockTime?.getTime() || 0) - (b.unlockTime?.getTime() || 0))[0];
    if (earliestUnlock?.unlockTime) {
      userGame.dateStarted = earliestUnlock.unlockTime;
      dateStarted = earliestUnlock.unlockTime;
      updated = true;
    }

    // Set dateCompleted if 100% achieved
    const allUnlocked = achievements.every(a => a.achieved);
    if (allUnlocked) {
      const latestUnlock = unlockedAchievements
        .sort((a, b) => (b.unlockTime?.getTime() || 0) - (a.unlockTime?.getTime() || 0))[0];
      if (latestUnlock?.unlockTime) {
        userGame.dateCompleted = latestUnlock.unlockTime;
        userGame.status = 'completed';
        dateCompleted = latestUnlock.unlockTime;
        updated = true;
      }
    }

    if (updated) {
      await this.userGameRepository.save(userGame);
      this.logger.log(`Synced dates for game ${userGameId}: started=${dateStarted}, completed=${dateCompleted}`);
    }

    return { dateStarted, dateCompleted, updated };
  }
}

