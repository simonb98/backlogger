import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number; // minutes
  img_icon_url: string;
  playtime_2weeks?: number;
}

export interface SteamProfile {
  steamid: string;
  personaname: string;
  avatarfull: string;
  profileurl: string;
}

@Injectable()
export class SteamService {
  private readonly logger = new Logger(SteamService.name);
  private readonly apiKey: string;
  private readonly apiUrl: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('steam.apiKey') || '';
    this.apiUrl = this.configService.get<string>('steam.apiUrl') || '';

    if (!this.apiKey) {
      this.logger.warn('Steam API key not configured');
    }
  }

  async resolveVanityUrl(vanityUrl: string): Promise<string> {
    const response = await axios.get(
      `${this.apiUrl}/ISteamUser/ResolveVanityURL/v1/`,
      { params: { key: this.apiKey, vanityurl: vanityUrl } }
    );

    if (response.data.response.success !== 1) {
      throw new BadRequestException('Could not resolve Steam vanity URL');
    }

    return response.data.response.steamid;
  }

  async getProfile(steamId: string): Promise<SteamProfile> {
    const response = await axios.get(
      `${this.apiUrl}/ISteamUser/GetPlayerSummaries/v2/`,
      { params: { key: this.apiKey, steamids: steamId } }
    );

    const players = response.data.response.players;
    if (!players || players.length === 0) {
      throw new BadRequestException('Steam profile not found');
    }

    return players[0];
  }

  async getOwnedGames(steamId: string): Promise<SteamGame[]> {
    const response = await axios.get(
      `${this.apiUrl}/IPlayerService/GetOwnedGames/v1/`,
      {
        params: {
          key: this.apiKey,
          steamid: steamId,
          include_appinfo: true,
          include_played_free_games: true,
        },
      }
    );

    const games = response.data.response.games;
    if (!games) {
      throw new BadRequestException(
        'Could not fetch games. Make sure the Steam profile is public.'
      );
    }

    return games;
  }

  extractSteamId(input: string): { type: 'id' | 'vanity'; value: string } {
    // Direct Steam ID (17 digit number)
    if (/^\d{17}$/.test(input)) {
      return { type: 'id', value: input };
    }

    // Full profile URL
    const profileMatch = input.match(/steamcommunity\.com\/profiles\/(\d{17})/);
    if (profileMatch) {
      return { type: 'id', value: profileMatch[1] };
    }

    // Vanity URL
    const vanityMatch = input.match(/steamcommunity\.com\/id\/([^\/]+)/);
    if (vanityMatch) {
      return { type: 'vanity', value: vanityMatch[1] };
    }

    // Assume it's a vanity name
    return { type: 'vanity', value: input };
  }

  async getSteamIdFromInput(input: string): Promise<string> {
    const extracted = this.extractSteamId(input);

    if (extracted.type === 'id') {
      return extracted.value;
    }

    return this.resolveVanityUrl(extracted.value);
  }
}

