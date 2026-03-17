import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface IgdbGame {
  id: number;
  name: string;
  slug?: string;
  summary?: string;
  storyline?: string;
  cover?: { id: number; image_id: string };
  screenshots?: { id: number; image_id: string }[];
  first_release_date?: number;
  genres?: { id: number; name: string }[];
  themes?: { id: number; name: string }[];
  game_modes?: { id: number; name: string }[];
  involved_companies?: {
    company: { id: number; name: string };
    developer: boolean;
    publisher: boolean;
  }[];
  platforms?: { id: number; name: string; abbreviation?: string }[];
  total_rating?: number;
  total_rating_count?: number;
}

@Injectable()
export class IgdbService implements OnModuleInit {
  private readonly logger = new Logger(IgdbService.name);
  private accessToken: string = '';
  private tokenExpiry: Date = new Date(0);
  private client: AxiosInstance;

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly authUrl: string;
  private readonly apiUrl: string;

  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get<string>('igdb.clientId') || '';
    this.clientSecret = this.configService.get<string>('igdb.clientSecret') || '';
    this.authUrl = this.configService.get<string>('igdb.authUrl') || '';
    this.apiUrl = this.configService.get<string>('igdb.apiUrl') || '';

    this.client = axios.create({
      baseURL: this.apiUrl,
    });
  }

  async onModuleInit() {
    if (this.clientId && this.clientSecret) {
      await this.authenticate();
    } else {
      this.logger.warn('IGDB credentials not configured. Set IGDB_CLIENT_ID and IGDB_CLIENT_SECRET.');
    }
  }

  private async authenticate(): Promise<void> {
    try {
      const response = await axios.post(this.authUrl, null, {
        params: {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'client_credentials',
        },
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + response.data.expires_in * 1000);
      this.logger.log('IGDB authentication successful');
    } catch (error) {
      this.logger.error('Failed to authenticate with IGDB', error);
      throw error;
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || new Date() >= this.tokenExpiry) {
      await this.authenticate();
    }
  }

  private async makeRequest<T>(endpoint: string, body: string): Promise<T> {
    await this.ensureAuthenticated();

    const response = await this.client.post<T>(endpoint, body, {
      headers: {
        'Client-ID': this.clientId,
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'text/plain',
      },
    });

    return response.data;
  }

  async search(query: string, limit: number = 20): Promise<IgdbGame[]> {
    const body = `
      search "${query}";
      fields name, slug, summary, cover.image_id, first_release_date,
             genres.name, platforms.id, platforms.name, platforms.abbreviation,
             total_rating, total_rating_count;
      limit ${limit};
    `;

    return this.makeRequest<IgdbGame[]>('/games', body);
  }

  async getPopular(limit: number = 20): Promise<IgdbGame[]> {
    // Get games released in the last 6 months with high ratings, sorted by popularity
    const sixMonthsAgo = Math.floor(Date.now() / 1000) - 6 * 30 * 24 * 60 * 60;
    const now = Math.floor(Date.now() / 1000);

    const body = `
      fields name, slug, summary, cover.image_id, first_release_date,
             genres.name, platforms.id, platforms.name, platforms.abbreviation,
             total_rating, total_rating_count, hypes, follows;
      where first_release_date >= ${sixMonthsAgo}
        & first_release_date <= ${now}
        & total_rating_count > 5
        & cover != null;
      sort total_rating desc;
      limit ${limit};
    `;

    return this.makeRequest<IgdbGame[]>('/games', body);
  }

  async getGame(igdbId: number): Promise<IgdbGame | null> {
    const body = `
      fields name, slug, summary, storyline, 
             cover.image_id, screenshots.image_id,
             first_release_date, genres.name, themes.name, game_modes.name,
             involved_companies.company.name, involved_companies.developer, involved_companies.publisher,
             platforms.name, platforms.abbreviation,
             total_rating, total_rating_count;
      where id = ${igdbId};
    `;

    const results = await this.makeRequest<IgdbGame[]>('/games', body);
    return results[0] || null;
  }

  getCoverUrl(imageId: string, size: 'thumb' | 'cover_small' | 'cover_big' | '720p' = 'cover_big'): string {
    return `https://images.igdb.com/igdb/image/upload/t_${size}/${imageId}.jpg`;
  }

  getScreenshotUrl(imageId: string, size: '720p' | '1080p' = '720p'): string {
    return `https://images.igdb.com/igdb/image/upload/t_screenshot_${size}/${imageId}.jpg`;
  }
}

