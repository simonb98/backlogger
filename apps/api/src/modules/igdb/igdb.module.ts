import { Module } from '@nestjs/common';
import { IgdbService } from './igdb.service';
import { IgdbController } from './igdb.controller';
import { PlatformsModule } from '../platforms/platforms.module';

@Module({
  imports: [PlatformsModule],
  controllers: [IgdbController],
  providers: [IgdbService],
  exports: [IgdbService],
})
export class IgdbModule {}

