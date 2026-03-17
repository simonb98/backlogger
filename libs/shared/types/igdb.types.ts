export interface IgdbGame {
  id: number;
  name: string;
  slug?: string;
  summary?: string;
  storyline?: string;
  cover?: IgdbCover;
  screenshots?: IgdbScreenshot[];
  first_release_date?: number;
  genres?: IgdbGenre[];
  themes?: IgdbTheme[];
  game_modes?: IgdbGameMode[];
  involved_companies?: IgdbInvolvedCompany[];
  platforms?: IgdbPlatform[];
  total_rating?: number;
  total_rating_count?: number;
}

export interface IgdbCover {
  id: number;
  image_id: string;
  url?: string;
}

export interface IgdbScreenshot {
  id: number;
  image_id: string;
  url?: string;
}

export interface IgdbGenre {
  id: number;
  name: string;
  slug: string;
}

export interface IgdbTheme {
  id: number;
  name: string;
  slug: string;
}

export interface IgdbGameMode {
  id: number;
  name: string;
  slug: string;
}

export interface IgdbInvolvedCompany {
  id: number;
  company: IgdbCompany;
  developer: boolean;
  publisher: boolean;
}

export interface IgdbCompany {
  id: number;
  name: string;
  slug: string;
}

export interface IgdbPlatform {
  id: number;
  name: string;
  slug: string;
  abbreviation?: string;
  category?: number;
}

export interface IgdbSearchResult {
  id: number;
  name: string;
  slug?: string;
  coverUrl?: string;
  releaseYear?: number;
  platforms?: string[];
}

