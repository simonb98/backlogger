import { Controller, Get, Param, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PlatformsService } from './platforms.service';

@ApiTags('Platforms')
@Controller('platforms')
export class PlatformsController {
  constructor(private readonly platformsService: PlatformsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all platforms' })
  async findAll() {
    return this.platformsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single platform' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const platform = await this.platformsService.findOne(id);
    if (!platform) {
      throw new NotFoundException('Platform not found');
    }
    return platform;
  }
}

