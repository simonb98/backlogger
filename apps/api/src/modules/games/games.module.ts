import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Game, UserGame } from '../../database/entities';
import { GamesService } from './games.service';
import { GamesController } from './games.controller';
import { IgdbModule } from '../igdb/igdb.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Game, UserGame]),
    IgdbModule,
  ],
  controllers: [GamesController],
  providers: [GamesService],
  exports: [GamesService],
})
export class GamesModule {}

