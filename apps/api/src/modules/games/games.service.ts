import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Game, UserGame } from '../../database/entities';
import { IgdbService } from '../igdb/igdb.service';
import { CreateGameDto, UpdateGameDto, GameFilterDto } from './dto';

@Injectable()
export class GamesService {
  constructor(
    @InjectRepository(Game)
    private gameRepository: Repository<Game>,
    @InjectRepository(UserGame)
    private userGameRepository: Repository<UserGame>,
    private igdbService: IgdbService,
  ) {}

  async findAll(filters: GameFilterDto) {
    const query = this.userGameRepository
      .createQueryBuilder('ug')
      .leftJoinAndSelect('ug.game', 'game')
      .leftJoinAndSelect('ug.platform', 'platform')
      .leftJoinAndSelect('ug.tags', 'tags');

    // Apply filters
    if (filters.status) {
      query.andWhere('ug.status = :status', { status: filters.status });
    }
    if (filters.platform) {
      query.andWhere('ug.platformId = :platformId', { platformId: filters.platform });
    }
    if (filters.genre) {
      query.andWhere(':genre = ANY(game.genres)', { genre: filters.genre });
    }
    if (filters.tag) {
      query.andWhere('tags.id = :tagId', { tagId: filters.tag });
    }
    if (filters.minRating) {
      query.andWhere('ug.rating >= :minRating', { minRating: filters.minRating });
    }
    if (filters.maxRating) {
      query.andWhere('ug.rating <= :maxRating', { maxRating: filters.maxRating });
    }
    if (filters.search) {
      query.andWhere('LOWER(game.name) LIKE LOWER(:search)', { search: `%${filters.search}%` });
    }

    // Sorting
    const sortMap: Record<string, string> = {
      name: 'game.name',
      date_added: 'ug.dateAdded',
      rating: 'ug.rating',
      playtime: 'ug.totalPlaytimeMins',
      release_date: 'game.releaseDate',
    };
    const sortField = sortMap[filters.sortBy || 'date_added'];
    query.orderBy(sortField, filters.sortOrder === 'asc' ? 'ASC' : 'DESC');

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await query.skip(skip).take(limit).getManyAndCount();

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<UserGame> {
    const userGame = await this.userGameRepository.findOne({
      where: { id },
      relations: ['game', 'platform', 'tags', 'sessions'],
    });

    if (!userGame) {
      throw new NotFoundException('Game not found in library');
    }

    return userGame;
  }

  async create(dto: CreateGameDto): Promise<UserGame> {
    // Get or create the game from IGDB
    let game = await this.gameRepository.findOne({ where: { igdbId: dto.igdbId } });

    if (!game) {
      const igdbGame = await this.igdbService.getGame(dto.igdbId);
      if (!igdbGame) {
        throw new NotFoundException('Game not found on IGDB');
      }

      const developer = igdbGame.involved_companies?.find((ic) => ic.developer)?.company.name;
      const publisher = igdbGame.involved_companies?.find((ic) => ic.publisher)?.company.name;

      game = this.gameRepository.create({
        igdbId: igdbGame.id,
        name: igdbGame.name,
        slug: igdbGame.slug,
        summary: igdbGame.summary,
        storyline: igdbGame.storyline,
        coverUrl: igdbGame.cover ? this.igdbService.getCoverUrl(igdbGame.cover.image_id) : undefined,
        screenshotUrls: igdbGame.screenshots?.map((s) => this.igdbService.getScreenshotUrl(s.image_id)),
        releaseDate: igdbGame.first_release_date ? new Date(igdbGame.first_release_date * 1000) : undefined,
        genres: igdbGame.genres?.map((g) => g.name),
        themes: igdbGame.themes?.map((t) => t.name),
        gameModes: igdbGame.game_modes?.map((gm) => gm.name),
        developer,
        publisher,
        igdbRating: igdbGame.total_rating,
        igdbRatingCount: igdbGame.total_rating_count,
      });

      game = await this.gameRepository.save(game);
    }

    // Check if already in library for this platform
    const existing = await this.userGameRepository.findOne({
      where: { gameId: game.id, platformId: dto.platformId },
    });

    if (existing) {
      throw new ConflictException('Game already in library for this platform');
    }

    // Create user game entry
    const userGame = this.userGameRepository.create({
      gameId: game.id,
      platformId: dto.platformId,
      status: dto.status || 'backlog',
      rating: dto.rating,
      notes: dto.notes,
      dateStarted: dto.status === 'playing' ? new Date() : undefined,
    });

    const saved = await this.userGameRepository.save(userGame);
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateGameDto): Promise<UserGame> {
    const userGame = await this.findOne(id);

    // Handle status change side effects
    if (dto.status && dto.status !== userGame.status) {
      if (dto.status === 'playing' && !userGame.dateStarted) {
        dto.dateStarted = new Date().toISOString();
      }
      if (dto.status === 'completed' && !userGame.dateCompleted) {
        dto.dateCompleted = new Date().toISOString();
      }
    }

    Object.assign(userGame, {
      ...dto,
      dateStarted: dto.dateStarted ? new Date(dto.dateStarted) : userGame.dateStarted,
      dateCompleted: dto.dateCompleted ? new Date(dto.dateCompleted) : userGame.dateCompleted,
      skippedUntil: dto.skippedUntil !== undefined
        ? (dto.skippedUntil ? new Date(dto.skippedUntil) : null)
        : userGame.skippedUntil,
    });

    await this.userGameRepository.save(userGame);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const userGame = await this.findOne(id);
    await this.userGameRepository.remove(userGame);
  }
}

