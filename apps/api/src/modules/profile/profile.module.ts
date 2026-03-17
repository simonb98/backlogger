import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, UserGame, Achievement } from '../../database/entities';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserGame, Achievement])],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}

