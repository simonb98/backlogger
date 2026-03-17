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
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GamesService } from './games.service';
import { CreateGameDto, UpdateGameDto, GameFilterDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@ApiTags('Games')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all games in library with filters' })
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() filters: GameFilterDto,
  ) {
    return this.gamesService.findAll(user.id, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single game from library' })
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.gamesService.findOne(user.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Add a game to library from IGDB' })
  @ApiResponse({ status: 201, description: 'Game added to library' })
  @ApiResponse({ status: 404, description: 'Game not found on IGDB' })
  @ApiResponse({ status: 409, description: 'Game already in library' })
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateGameDto,
  ) {
    return this.gamesService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a game in library' })
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGameDto,
  ) {
    return this.gamesService.update(user.id, id, dto);
  }

  @Patch()
  @ApiOperation({ summary: 'Bulk update games in library' })
  async bulkUpdate(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: { ids: number[]; updates: UpdateGameDto },
  ) {
    return this.gamesService.bulkUpdate(user.id, dto.ids, dto.updates);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a game from library' })
  async remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.gamesService.remove(user.id, id);
  }
}

