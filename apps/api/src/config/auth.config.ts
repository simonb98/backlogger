import { registerAs } from '@nestjs/config';

export const authConfig = registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production-min-32-chars',
  jwtExpiration: process.env.JWT_EXPIRATION || '7d',
}));

