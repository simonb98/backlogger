import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GamesService } from './games.service';
import { CreateGameDto, UpdateGameDto, GameFilterDto } from './dto';

@ApiTags('Games')
@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all games in library with filters' })
  async findAll(@Query() filters: GameFilterDto) {
    return this.gamesService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single game from library' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.gamesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Add a game to library from IGDB' })
  @ApiResponse({ status: 201, description: 'Game added to library' })
  @ApiResponse({ status: 404, description: 'Game not found on IGDB' })
  @ApiResponse({ status: 409, description: 'Game already in library' })
  async create(@Body() dto: CreateGameDto) {
    return this.gamesService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a game in library' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGameDto,
  ) {
    return this.gamesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a game from library' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.gamesService.remove(id);
  }
}

