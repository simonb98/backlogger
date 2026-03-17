import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import type { SteamProfile } from './auth.service';

@Injectable()
export class SteamAuthService {
  private readonly steamApiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.steamApiKey = this.configService.get<string>('steam.apiKey') || '';
  }

  /**
   * Generate Steam OpenID login URL
   */
  getLoginUrl(returnUrl: string): string {
    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': returnUrl,
      'openid.realm': returnUrl.split('/api')[0],
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    });

    return `https://steamcommunity.com/openid/login?${params.toString()}`;
  }

  /**
   * Validate Steam OpenID callback and extract Steam ID
   */
  async validateCallback(query: Record<string, string>): Promise<SteamProfile> {
    // Verify the response with Steam
    const params = new URLSearchParams();
    
    for (const [key, value] of Object.entries(query)) {
      params.append(key, value);
    }
    
    // Change mode to check_authentication for verification
    params.set('openid.mode', 'check_authentication');

    const response = await axios.post(
      'https://steamcommunity.com/openid/login',
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    if (!response.data.includes('is_valid:true')) {
      throw new UnauthorizedException('Steam authentication failed');
    }

    // Extract Steam ID from claimed_id
    // Format: https://steamcommunity.com/openid/id/76561198012345678
    const claimedId = query['openid.claimed_id'];
    const steamIdMatch = claimedId?.match(/\/id\/(\d+)$/);
    
    if (!steamIdMatch) {
      throw new UnauthorizedException('Could not extract Steam ID');
    }

    const steamId = steamIdMatch[1];

    // Fetch user profile from Steam API
    return this.getSteamProfile(steamId);
  }

  /**
   * Fetch Steam user profile
   */
  async getSteamProfile(steamId: string): Promise<SteamProfile> {
    const response = await axios.get(
      'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/',
      {
        params: {
          key: this.steamApiKey,
          steamids: steamId,
        },
      },
    );

    const player = response.data?.response?.players?.[0];
    
    if (!player) {
      throw new UnauthorizedException('Could not fetch Steam profile');
    }

    return {
      steamId: player.steamid,
      personaName: player.personaname,
      avatar: player.avatarfull || player.avatar,
    };
  }
}

