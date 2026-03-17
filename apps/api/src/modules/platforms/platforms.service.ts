import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Platform } from '../../database/entities';

const DEFAULT_PLATFORMS = [
  { name: 'PC (Windows)', abbreviation: 'PC', category: 'pc', igdbId: 6 },
  { name: 'PlayStation 5', abbreviation: 'PS5', category: 'console', igdbId: 167 },
  { name: 'PlayStation 4', abbreviation: 'PS4', category: 'console', igdbId: 48 },
  { name: 'Xbox Series X|S', abbreviation: 'XSX', category: 'console', igdbId: 169 },
  { name: 'Xbox One', abbreviation: 'XB1', category: 'console', igdbId: 49 },
  { name: 'Nintendo Switch', abbreviation: 'Switch', category: 'console', igdbId: 130 },
  { name: 'Steam Deck', abbreviation: 'Deck', category: 'portable', igdbId: 386 },
  { name: 'iOS', abbreviation: 'iOS', category: 'mobile', igdbId: 39 },
  { name: 'Android', abbreviation: 'Android', category: 'mobile', igdbId: 34 },
  { name: 'macOS', abbreviation: 'Mac', category: 'pc', igdbId: 14 },
  { name: 'Linux', abbreviation: 'Linux', category: 'pc', igdbId: 3 },
  { name: 'PlayStation 3', abbreviation: 'PS3', category: 'console', igdbId: 9 },
  { name: 'Xbox 360', abbreviation: 'X360', category: 'console', igdbId: 12 },
  { name: 'Nintendo 3DS', abbreviation: '3DS', category: 'portable', igdbId: 37 },
  { name: 'PlayStation Vita', abbreviation: 'Vita', category: 'portable', igdbId: 46 },
];

@Injectable()
export class PlatformsService implements OnModuleInit {
  constructor(
    @InjectRepository(Platform)
    private platformRepository: Repository<Platform>,
  ) {}

  async onModuleInit() {
    await this.seedPlatforms();
  }

  private async seedPlatforms(): Promise<void> {
    for (const platformData of DEFAULT_PLATFORMS) {
      const existing = await this.platformRepository.findOne({
        where: { abbreviation: platformData.abbreviation },
      });

      if (!existing) {
        const platform = this.platformRepository.create(platformData);
        await this.platformRepository.save(platform);
      }
    }
  }

  async findAll(): Promise<Platform[]> {
    return this.platformRepository.find({
      order: { category: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Platform | null> {
    return this.platformRepository.findOne({ where: { id } });
  }

  async findByIgdbId(igdbId: number): Promise<Platform | null> {
    return this.platformRepository.findOne({ where: { igdbId } });
  }
}

