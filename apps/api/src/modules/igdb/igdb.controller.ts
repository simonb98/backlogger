import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IgdbService, IgdbGame } from './igdb.service';
import { IgdbSearchDto, IgdbSearchResultDto } from './dto/igdb-search.dto';

@ApiTags('IGDB')
@Controller('igdb')
export class IgdbController {
  constructor(private readonly igdbService: IgdbService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search for games on IGDB' })
  @ApiResponse({ status: 200, description: 'Search results', type: [IgdbSearchResultDto] })
  async search(@Query() query: IgdbSearchDto): Promise<IgdbSearchResultDto[]> {
    const results = await this.igdbService.search(query.q, query.limit);
    return results.map((game) => this.mapToSearchResult(game));
  }

  @Get('game/:igdbId')
  @ApiOperation({ summary: 'Get full game details from IGDB' })
  async getGame(@Param('igdbId', ParseIntPipe) igdbId: number) {
    const game = await this.igdbService.getGame(igdbId);
    if (!game) {
      return null;
    }
    return this.mapToFullGame(game);
  }

  private mapToSearchResult(game: IgdbGame): IgdbSearchResultDto {
    return {
      id: game.id,
      name: game.name,
      slug: game.slug,
      coverUrl: game.cover
        ? this.igdbService.getCoverUrl(game.cover.image_id)
        : undefined,
      releaseYear: game.first_release_date
        ? new Date(game.first_release_date * 1000).getFullYear()
        : undefined,
      platforms: game.platforms?.map((p) => ({
        id: p.id,
        name: p.name,
        abbreviation: p.abbreviation,
      })),
      rating: game.total_rating ? Math.round(game.total_rating) : undefined,
    };
  }

  private mapToFullGame(game: IgdbGame) {
    const developer = game.involved_companies?.find((ic) => ic.developer)?.company.name;
    const publisher = game.involved_companies?.find((ic) => ic.publisher)?.company.name;

    return {
      id: game.id,
      name: game.name,
      slug: game.slug,
      summary: game.summary,
      storyline: game.storyline,
      coverUrl: game.cover
        ? this.igdbService.getCoverUrl(game.cover.image_id)
        : undefined,
      screenshotUrls: game.screenshots?.map((s) =>
        this.igdbService.getScreenshotUrl(s.image_id)
      ),
      releaseDate: game.first_release_date
        ? new Date(game.first_release_date * 1000).toISOString()
        : undefined,
      genres: game.genres?.map((g) => g.name),
      themes: game.themes?.map((t) => t.name),
      gameModes: game.game_modes?.map((gm) => gm.name),
      developer,
      publisher,
      platforms: game.platforms?.map((p) => ({
        id: p.id,
        name: p.name,
        abbreviation: p.abbreviation,
      })),
      rating: game.total_rating,
      ratingCount: game.total_rating_count,
    };
  }
}

