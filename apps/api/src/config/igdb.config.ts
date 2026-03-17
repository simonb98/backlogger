import { registerAs } from '@nestjs/config';

export default registerAs('igdb', () => ({
  clientId: process.env.IGDB_CLIENT_ID || '',
  clientSecret: process.env.IGDB_CLIENT_SECRET || '',
  authUrl: 'https://id.twitch.tv/oauth2/token',
  apiUrl: 'https://api.igdb.com/v4',
}));

