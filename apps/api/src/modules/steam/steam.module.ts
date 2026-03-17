import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Game, UserGame, Platform, User, Achievement } from '../../database/entities';
import { SteamService } from './steam.service';
import { SteamImportService } from './steam-import.service';
import { SteamAchievementService } from './steam-achievement.service';
import { SteamController } from './steam.controller';
import { IgdbModule } from '../igdb/igdb.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Game, UserGame, Platform, User, Achievement]),
    IgdbModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('auth.jwtSecret') || 'fallback-secret',
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [SteamController],
  providers: [SteamService, SteamImportService, SteamAchievementService],
  exports: [SteamService, SteamAchievementService],
})
export class SteamModule {}

