import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.API_PORT || '3000', 10),
  prefix: process.env.API_PREFIX || '/api/v1',
}));

