import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game, UserGame, Platform } from '../../database/entities';
import { SteamService } from './steam.service';
import { SteamImportService } from './steam-import.service';
import { SteamController } from './steam.controller';
import { IgdbModule } from '../igdb/igdb.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Game, UserGame, Platform]),
    IgdbModule,
  ],
  controllers: [SteamController],
  providers: [SteamService, SteamImportService],
  exports: [SteamService],
})
export class SteamModule {}

