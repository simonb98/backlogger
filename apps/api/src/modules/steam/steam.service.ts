import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface SteamGame {
  appid: number;
  name: string;
  playtime_forever: number; // minutes
  img_icon_url: string;
  playtime_2weeks?: number;
  rtime_last_played?: number; // Unix timestamp of last played
}

export interface SteamProfile {
  steamid: string;
  personaname: string;
  avatarfull: string;
  profileurl: string;
}

export interface SteamAchievement {
  apiname: string;
  achieved: number;
  unlocktime: number;
  name?: string;
  description?: string;
}

export interface SteamAchievementSchema {
  name: string;
  defaultvalue: number;
  displayName: string;
  hidden: number;
  description: string;
  icon: string;
  icongray: string;
}

export interface SteamGlobalAchievement {
  name: string;
  percent: number;
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

  async getPlayerAchievements(steamId: string, appId: number): Promise<SteamAchievement[]> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/ISteamUserStats/GetPlayerAchievements/v1/`,
        { params: { key: this.apiKey, steamid: steamId, appid: appId } }
      );

      if (!response.data.playerstats?.success) {
        return [];
      }

      return response.data.playerstats.achievements || [];
    } catch (error) {
      this.logger.debug(`No achievements for app ${appId}: ${error.message}`);
      return [];
    }
  }

  async getAchievementSchema(appId: number): Promise<SteamAchievementSchema[]> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/ISteamUserStats/GetSchemaForGame/v2/`,
        { params: { key: this.apiKey, appid: appId } }
      );

      return response.data.game?.availableGameStats?.achievements || [];
    } catch (error) {
      this.logger.debug(`No achievement schema for app ${appId}: ${error.message}`);
      return [];
    }
  }

  async getGlobalAchievementPercentages(appId: number): Promise<Map<string, number>> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/`,
        { params: { gameid: appId } }
      );

      const achievements = response.data.achievementpercentages?.achievements || [];
      const map = new Map<string, number>();
      for (const a of achievements) {
        map.set(a.name, a.percent);
      }
      return map;
    } catch (error) {
      this.logger.debug(`No global percentages for app ${appId}: ${error.message}`);
      return new Map();
    }
  }

  async getFullAchievements(steamId: string, appId: number) {
    const [playerAchievements, schema, globalPercentages] = await Promise.all([
      this.getPlayerAchievements(steamId, appId),
      this.getAchievementSchema(appId),
      this.getGlobalAchievementPercentages(appId),
    ]);

    if (schema.length === 0) {
      return [];
    }

    const schemaMap = new Map(schema.map(s => [s.name, s]));
    const playerMap = new Map(playerAchievements.map(a => [a.apiname, a]));

    return schema.map(s => {
      const player = playerMap.get(s.name);
      return {
        apiName: s.name,
        name: s.displayName,
        description: s.description,
        iconUrl: s.icon,
        iconGrayUrl: s.icongray,
        achieved: player?.achieved === 1,
        unlockTime: player?.unlocktime ? new Date(player.unlocktime * 1000) : null,
        globalPercent: globalPercentages.get(s.name) || null,
      };
    });
  }
}

