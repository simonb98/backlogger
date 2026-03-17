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

// Maps IGDB platform IDs to our platform abbreviations
// This handles cases like "Switch 2" mapping to "Nintendo Switch"
const IGDB_PLATFORM_MAPPING: Record<number, string> = {
  // PC variants
  6: 'PC',      // PC (Microsoft Windows)
  13: 'PC',     // DOS
  14: 'Mac',    // Mac
  3: 'Linux',   // Linux
  92: 'Deck',   // Steam Deck - but also map PC games to deck
  386: 'Deck',  // Steam Deck

  // PlayStation
  167: 'PS5',   // PlayStation 5
  48: 'PS4',    // PlayStation 4
  9: 'PS3',     // PlayStation 3
  8: 'PS2',     // PlayStation 2 (not in our list but keep mapping)
  7: 'PS1',     // PlayStation (not in our list)
  46: 'Vita',   // PlayStation Vita
  38: 'PSP',    // PSP (not in our list)

  // Xbox
  169: 'XSX',   // Xbox Series X|S
  49: 'XB1',    // Xbox One
  12: 'X360',   // Xbox 360
  11: 'Xbox',   // Xbox (original, not in our list)

  // Nintendo
  130: 'Switch',  // Nintendo Switch
  508: 'Switch',  // Nintendo Switch 2 -> maps to Switch
  137: '3DS',     // Nintendo 3DS
  4: 'N64',       // Nintendo 64 (not in our list)
  5: 'Wii',       // Wii (not in our list)
  41: 'WiiU',     // Wii U (not in our list)

  // Mobile
  39: 'iOS',      // iOS
  34: 'Android',  // Android
};

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

  /**
   * Maps an IGDB platform ID to our platform.
   * Handles cases like "Switch 2" (441) mapping to "Nintendo Switch" (130)
   */
  async mapIgdbPlatform(igdbPlatformId: number): Promise<Platform | null> {
    // First try direct match
    const direct = await this.findByIgdbId(igdbPlatformId);
    if (direct) return direct;

    // Try mapped abbreviation
    const abbreviation = IGDB_PLATFORM_MAPPING[igdbPlatformId];
    if (abbreviation) {
      return this.platformRepository.findOne({ where: { abbreviation } });
    }

    return null;
  }

  /**
   * Maps multiple IGDB platform IDs to our platforms (deduplicated)
   */
  async mapIgdbPlatforms(igdbPlatformIds: number[]): Promise<Platform[]> {
    const platforms = new Map<number, Platform>();

    for (const igdbId of igdbPlatformIds) {
      const platform = await this.mapIgdbPlatform(igdbId);
      if (platform && !platforms.has(platform.id)) {
        platforms.set(platform.id, platform);
      }
    }

    return Array.from(platforms.values());
  }
}

