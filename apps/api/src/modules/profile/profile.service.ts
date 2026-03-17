import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserGame } from '../../database/entities';

export interface ProfileStats {
  user: {
    id: number;
    email?: string;
    displayName?: string;
    steamId?: string;
    steamAvatar?: string;
    createdAt: Date;
  };
  stats: {
    totalGames: number;
    totalPlaytimeHours: number;
    completedGames: number;
    playingGames: number;
    backlogGames: number;
    averageRating: number | null;
    platformBreakdown: { platform: string; count: number }[];
    statusBreakdown: { status: string; count: number }[];
  };
  recentlyPlayed: {
    id: number;
    name: string;
    coverUrl?: string;
    platform: string;
    playtimeHours: number;
    lastPlayed?: Date;
  }[];
}

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserGame)
    private userGameRepository: Repository<UserGame>,
  ) {}

  async getProfileStats(userId: number): Promise<ProfileStats> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new Error('User not found');
    }

    // Get total games count
    const totalGames = await this.userGameRepository.count({ where: { userId } });

    // Get total playtime
    const playtimeResult = await this.userGameRepository
      .createQueryBuilder('ug')
      .select('SUM(ug.totalPlaytimeMins)', 'total')
      .where('ug.userId = :userId', { userId })
      .getRawOne();
    const totalPlaytimeMins = parseInt(playtimeResult?.total || '0', 10);

    // Get status counts
    const statusCounts = await this.userGameRepository
      .createQueryBuilder('ug')
      .select('ug.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('ug.userId = :userId', { userId })
      .groupBy('ug.status')
      .getRawMany();

    const statusMap = statusCounts.reduce((acc, { status, count }) => {
      acc[status] = parseInt(count, 10);
      return acc;
    }, {} as Record<string, number>);

    // Get average rating (excluding unrated)
    const ratingResult = await this.userGameRepository
      .createQueryBuilder('ug')
      .select('AVG(ug.rating)', 'avg')
      .where('ug.userId = :userId', { userId })
      .andWhere('ug.rating IS NOT NULL')
      .andWhere('ug.rating > 0')
      .getRawOne();
    const averageRating = ratingResult?.avg ? parseFloat(parseFloat(ratingResult.avg).toFixed(1)) : null;

    // Get platform breakdown
    const platformCounts = await this.userGameRepository
      .createQueryBuilder('ug')
      .leftJoin('ug.platform', 'platform')
      .select('platform.name', 'platform')
      .addSelect('COUNT(*)', 'count')
      .where('ug.userId = :userId', { userId })
      .groupBy('platform.name')
      .orderBy('count', 'DESC')
      .getRawMany();

    // Get 5 most recently played games (by playtime or date)
    const recentlyPlayed = await this.userGameRepository
      .createQueryBuilder('ug')
      .leftJoinAndSelect('ug.game', 'game')
      .leftJoinAndSelect('ug.platform', 'platform')
      .where('ug.userId = :userId', { userId })
      .andWhere('ug.totalPlaytimeMins > 0')
      .orderBy('ug.updatedAt', 'DESC')
      .take(5)
      .getMany();

    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        steamId: user.steamId,
        steamAvatar: user.steamAvatar,
        createdAt: user.createdAt,
      },
      stats: {
        totalGames,
        totalPlaytimeHours: Math.round(totalPlaytimeMins / 60),
        completedGames: statusMap['completed'] || 0,
        playingGames: statusMap['playing'] || 0,
        backlogGames: statusMap['backlog'] || 0,
        averageRating,
        platformBreakdown: platformCounts.map(p => ({
          platform: p.platform,
          count: parseInt(p.count, 10),
        })),
        statusBreakdown: statusCounts.map(s => ({
          status: s.status,
          count: parseInt(s.count, 10),
        })),
      },
      recentlyPlayed: recentlyPlayed.map(ug => ({
        id: ug.id,
        name: ug.game.name,
        coverUrl: ug.game.coverUrl,
        platform: ug.platform.name,
        playtimeHours: Math.round(ug.totalPlaytimeMins / 60),
        lastPlayed: ug.updatedAt,
      })),
    };
  }
}

