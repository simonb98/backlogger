import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig, igdbConfig, appConfig, steamConfig, authConfig } from './config';
import { User, Game, Platform, UserGame, PlaySession, CustomTag } from './database/entities';
import { AuthModule } from './modules/auth/auth.module';
import { IgdbModule } from './modules/igdb/igdb.module';
import { PlatformsModule } from './modules/platforms/platforms.module';
import { GamesModule } from './modules/games/games.module';
import { SteamModule } from './modules/steam/steam.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, igdbConfig, appConfig, steamConfig, authConfig],
      envFilePath: ['.env', '../../.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        database: configService.get<string>('database.database'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        entities: [User, Game, Platform, UserGame, PlaySession, CustomTag],
        synchronize: true, // TODO: Use migrations in production
        logging: process.env.NODE_ENV === 'development',
      }),
    }),
    AuthModule,
    IgdbModule,
    PlatformsModule,
    GamesModule,
    SteamModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
