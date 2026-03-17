import { registerAs } from '@nestjs/config';

export default registerAs('steam', () => ({
  apiKey: process.env.STEAM_API_KEY || '',
  apiUrl: 'https://api.steampowered.com',
}));

