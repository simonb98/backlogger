# Backlogger - Implementation Plan

## 1. Overview

**Backlogger** is a personal game tracking and backlog management application that helps users organize their gaming library, track progress, log play sessions, and view statistics about their gaming habits.

### Goals
- Provide a clean, intuitive interface for managing a game backlog
- Integrate with IGDB for rich game metadata
- Track play sessions, progress, and personal ratings
- Offer insightful statistics about gaming habits
- Build a solid foundation for future features (PWA, multi-user, platform imports)

### Success Criteria
- Users can search and add games from IGDB
- Users can track game status, ratings, and progress
- Users can log play sessions with duration
- Dashboard displays meaningful statistics
- Application is responsive and performant
- Code follows clean architecture principles

### Scope Boundaries
**Included:**
- Single-user application (auth-ready structure)
- IGDB integration for game data
- Full CRUD for game library
- Play session tracking
- Statistics dashboard
- Filtering, sorting, and search

**Excluded (Future Phases):**
- User authentication/multi-user
- PWA/offline mode
- Social features (friends, sharing)
- Achievements tracking
- Physical and digital game distinction
- Lending out games to friends feature

---


## 2. Prerequisites

### Development Environment
- Node.js 20+ LTS
- npm 10+ or pnpm 9+
- Docker & Docker Compose (for PostgreSQL)
- Angular CLI 19+
- NestJS CLI 10+
- Git

### External Services
- **IGDB API**: Requires Twitch Developer account
  - Client ID and Client Secret from https://dev.twitch.tv/console
  - IGDB API access (free tier sufficient)

### Configuration Requirements
- Environment variables for IGDB credentials
- PostgreSQL connection string
- API base URL configuration

---

## 3. Project Structure

### Monorepo Structure
```
backlogger/
├── apps/
│   ├── api/                    # NestJS Backend
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── config/         # Configuration module
│   │   │   │   ├── config.module.ts
│   │   │   │   ├── database.config.ts
│   │   │   │   ├── igdb.config.ts
│   │   │   │   └── app.config.ts
│   │   │   ├── common/         # Shared utilities
│   │   │   │   ├── decorators/
│   │   │   │   ├── filters/
│   │   │   │   │   └── http-exception.filter.ts
│   │   │   │   ├── interceptors/
│   │   │   │   │   └── transform.interceptor.ts
│   │   │   │   ├── pipes/
│   │   │   │   └── guards/
│   │   │   ├── database/       # Database module
│   │   │   │   ├── database.module.ts
│   │   │   │   ├── entities/
│   │   │   │   │   ├── game.entity.ts
│   │   │   │   │   ├── user-game.entity.ts
│   │   │   │   │   ├── play-session.entity.ts
│   │   │   │   │   ├── custom-tag.entity.ts
│   │   │   │   │   └── platform.entity.ts
│   │   │   │   ├── repositories/
│   │   │   │   │   ├── game.repository.ts
│   │   │   │   │   ├── user-game.repository.ts
│   │   │   │   │   └── play-session.repository.ts
│   │   │   │   └── migrations/
│   │   │   ├── modules/
│   │   │   │   ├── games/      # Game management module
│   │   │   │   │   ├── games.module.ts
│   │   │   │   │   ├── games.controller.ts
│   │   │   │   │   ├── games.service.ts
│   │   │   │   │   ├── dto/
│   │   │   │   │   │   ├── create-game.dto.ts
│   │   │   │   │   │   ├── update-game.dto.ts
│   │   │   │   │   │   ├── game-filter.dto.ts
│   │   │   │   │   │   └── game-response.dto.ts
│   │   │   │   │   └── interfaces/
│   │   │   │   ├── igdb/       # IGDB integration module
│   │   │   │   │   ├── igdb.module.ts
│   │   │   │   │   ├── igdb.service.ts
│   │   │   │   │   ├── igdb.client.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── sessions/   # Play session module
│   │   │   │   │   ├── sessions.module.ts
│   │   │   │   │   ├── sessions.controller.ts
│   │   │   │   │   ├── sessions.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── stats/      # Statistics module
│   │   │   │   │   ├── stats.module.ts
│   │   │   │   │   ├── stats.controller.ts
│   │   │   │   │   ├── stats.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   └── tags/       # Custom tags module
│   │   │   │       ├── tags.module.ts
│   │   │   │       ├── tags.controller.ts
│   │   │   │       └── tags.service.ts
│   │   │   └── health/         # Health check
│   │   ├── test/
│   │   └── package.json
│   │
│   └── web/                    # Angular Frontend
│       ├── src/
│       │   ├── main.ts
│       │   ├── app/
│       │   │   ├── app.component.ts
│       │   │   ├── app.config.ts
│       │   │   ├── app.routes.ts
│       │   │   ├── core/       # Core module (singletons)
│       │   │   │   ├── services/
│       │   │   │   │   ├── api.service.ts
│       │   │   │   │   ├── games.service.ts
│       │   │   │   │   ├── sessions.service.ts
│       │   │   │   │   └── stats.service.ts
│       │   │   │   ├── interceptors/
│       │   │   │   │   └── error.interceptor.ts
│       │   │   │   ├── guards/
│       │   │   │   └── models/
│       │   │   │       ├── game.model.ts
│       │   │   │       ├── session.model.ts
│       │   │   │       └── stats.model.ts
│       │   │   ├── shared/     # Shared components
│       │   │   │   ├── components/
│       │   │   │   │   ├── game-card/
│       │   │   │   │   ├── rating-input/
│       │   │   │   │   ├── status-badge/
│       │   │   │   │   ├── search-input/
│       │   │   │   │   └── loading-spinner/
│       │   │   │   ├── pipes/
│       │   │   │   │   └── playtime.pipe.ts
│       │   │   │   └── directives/
│       │   │   ├── features/   # Feature modules (lazy loaded)
│       │   │   │   ├── library/
│       │   │   │   │   ├── library.routes.ts
│       │   │   │   │   ├── library.component.ts
│       │   │   │   │   ├── components/
│       │   │   │   │   │   ├── game-list/
│       │   │   │   │   │   ├── game-filters/
│       │   │   │   │   │   └── add-game-dialog/
│       │   │   │   │   └── store/
│       │   │   │   │       ├── library.store.ts
│       │   │   │   │       └── library.selectors.ts
│       │   │   │   ├── game-detail/
│       │   │   │   │   ├── game-detail.routes.ts
│       │   │   │   │   ├── game-detail.component.ts
│       │   │   │   │   └── components/
│       │   │   │   │       ├── game-info/
│       │   │   │   │       ├── session-list/
│       │   │   │   │       ├── session-form/
│       │   │   │   │       └── notes-editor/
│       │   │   │   ├── dashboard/
│       │   │   │   │   ├── dashboard.routes.ts
│       │   │   │   │   ├── dashboard.component.ts
│       │   │   │   │   └── components/
│       │   │   │   │       ├── status-chart/
│       │   │   │   │       ├── playtime-chart/
│       │   │   │   │       ├── currently-playing/
│       │   │   │   │       └── stats-summary/
│       │   │   │   └── search/
│       │   │   │       ├── search.routes.ts
│       │   │   │       ├── search.component.ts
│       │   │   │       └── components/
│       │   │   │           └── igdb-results/
│       │   │   └── state/      # Global state (signals-based)
│       │   │       ├── app.store.ts
│       │   │       └── filters.store.ts
│       │   ├── environments/
│       │   ├── styles/
│       │   │   ├── _variables.scss
│       │   │   ├── _mixins.scss
│       │   │   └── styles.scss
│       │   └── assets/
│       ├── angular.json
│       └── package.json
│
├── libs/                       # Shared libraries (optional)
│   └── shared/
│       └── types/              # Shared TypeScript interfaces
│           ├── game.types.ts
│           ├── session.types.ts
│           └── api.types.ts
│
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   └── postgres/
│       └── init.sql
│
├── .env.example
├── package.json                # Root package.json for workspace
├── tsconfig.base.json
└── README.md
```

---

## 4. Database Schema Design

### Entity Relationship Diagram (Conceptual)

```
┌─────────────┐       ┌──────────────┐       ┌───────────────┐
│    Game     │       │   UserGame   │       │  PlaySession  │
│  (IGDB ref) │◄──────│  (junction)  │───────►│               │
└─────────────┘       └──────────────┘       └───────────────┘
      │                      │
      │                      │
      ▼                      ▼
┌─────────────┐       ┌──────────────┐
│  Platform   │       │  CustomTag   │
└─────────────┘       └──────────────┘
```

### Tables

#### `games` - Cached IGDB game data
```sql
CREATE TABLE games (
    id              SERIAL PRIMARY KEY,
    igdb_id         INTEGER UNIQUE NOT NULL,
    name            VARCHAR(500) NOT NULL,
    slug            VARCHAR(500),
    summary         TEXT,
    storyline       TEXT,
    cover_url       VARCHAR(1000),
    screenshot_urls TEXT[],               -- Array of URLs
    release_date    TIMESTAMP,
    genres          VARCHAR(100)[],       -- Array: ["RPG", "Action"]
    themes          VARCHAR(100)[],
    game_modes      VARCHAR(100)[],       -- Single player, Multiplayer, etc.
    developer       VARCHAR(255),
    publisher       VARCHAR(255),
    igdb_rating     DECIMAL(4,2),         -- IGDB community rating
    igdb_rating_count INTEGER,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_games_igdb_id ON games(igdb_id);
CREATE INDEX idx_games_name ON games(name);
```

#### `platforms` - Gaming platforms
```sql
CREATE TABLE platforms (
    id          SERIAL PRIMARY KEY,
    igdb_id     INTEGER UNIQUE,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100),
    abbreviation VARCHAR(20),
    category    VARCHAR(50),              -- console, pc, mobile, etc.
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Seed data: PC, PlayStation 5, Xbox Series X, Nintendo Switch, etc.
```

#### `user_games` - User's game library (core junction table)
```sql
CREATE TABLE user_games (
    id                  SERIAL PRIMARY KEY,
    -- user_id          INTEGER REFERENCES users(id),  -- Future: multi-user
    game_id             INTEGER REFERENCES games(id) ON DELETE CASCADE,
    platform_id         INTEGER REFERENCES platforms(id),

    -- Status tracking
    status              VARCHAR(20) NOT NULL DEFAULT 'backlog',
                        -- backlog, playing, completed, dropped, wishlist, on_hold

    -- User ratings & notes
    rating              SMALLINT CHECK (rating >= 1 AND rating <= 10),
    notes               TEXT,
    review              TEXT,

    -- Progress tracking
    completion_percent  SMALLINT DEFAULT 0 CHECK (completion_percent >= 0 AND completion_percent <= 100),
    total_playtime_mins INTEGER DEFAULT 0,        -- Aggregated from sessions

    -- Metadata
    date_added          TIMESTAMP DEFAULT NOW(),
    date_started        TIMESTAMP,
    date_completed      TIMESTAMP,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),

    UNIQUE(game_id, platform_id)  -- Can own same game on multiple platforms
);

CREATE INDEX idx_user_games_status ON user_games(status);
CREATE INDEX idx_user_games_game_id ON user_games(game_id);
CREATE INDEX idx_user_games_platform_id ON user_games(platform_id);
CREATE INDEX idx_user_games_rating ON user_games(rating);
```

#### `play_sessions` - Individual play sessions
```sql
CREATE TABLE play_sessions (
    id              SERIAL PRIMARY KEY,
    user_game_id    INTEGER REFERENCES user_games(id) ON DELETE CASCADE,

    session_date    DATE NOT NULL,
    duration_mins   INTEGER NOT NULL CHECK (duration_mins > 0),
    notes           TEXT,

    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_play_sessions_user_game_id ON play_sessions(user_game_id);
CREATE INDEX idx_play_sessions_session_date ON play_sessions(session_date);
```

#### `custom_tags` - User-defined tags
```sql
CREATE TABLE custom_tags (
    id          SERIAL PRIMARY KEY,
    -- user_id  INTEGER REFERENCES users(id),  -- Future: multi-user
    name        VARCHAR(50) NOT NULL,
    color       VARCHAR(7),                     -- Hex color: #FF5733
    created_at  TIMESTAMP DEFAULT NOW(),

    UNIQUE(name)
);
```

#### `user_game_tags` - Junction for custom tags
```sql
CREATE TABLE user_game_tags (
    user_game_id    INTEGER REFERENCES user_games(id) ON DELETE CASCADE,
    tag_id          INTEGER REFERENCES custom_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (user_game_id, tag_id)
);
```

#### `game_platforms` - Junction for game-platform availability
```sql
CREATE TABLE game_platforms (
    game_id     INTEGER REFERENCES games(id) ON DELETE CASCADE,
    platform_id INTEGER REFERENCES platforms(id) ON DELETE CASCADE,
    PRIMARY KEY (game_id, platform_id)
);
```

---

## 5. API Endpoint Design

### Base URL
```
/api/v1
```

### Authentication (Future-Ready)
```
Authorization: Bearer <jwt_token>
```

### Response Format
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}
```

### Endpoints

#### Games (Library)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/games` | Get user's game library (with filters) |
| GET | `/games/:id` | Get single game details |
| POST | `/games` | Add game to library (from IGDB) |
| PATCH | `/games/:id` | Update game (status, rating, notes, etc.) |
| DELETE | `/games/:id` | Remove game from library |

**GET /games - Query Parameters:**
```typescript
interface GameFilterParams {
  status?: 'backlog' | 'playing' | 'completed' | 'dropped' | 'wishlist' | 'on_hold';
  platform?: number;          // Platform ID
  genre?: string;             // Genre name
  tag?: number;               // Custom tag ID
  minRating?: number;         // 1-10
  maxRating?: number;         // 1-10
  search?: string;            // Name search
  sortBy?: 'name' | 'date_added' | 'rating' | 'playtime' | 'release_date';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;             // Default: 20, Max: 100
}
```

**POST /games - Request Body:**
```typescript
interface AddGameDto {
  igdbId: number;             // Required: IGDB game ID
  platformId: number;         // Required: Platform ID
  status?: GameStatus;        // Default: 'backlog'
  rating?: number;
  notes?: string;
}
```

**PATCH /games/:id - Request Body:**
```typescript
interface UpdateGameDto {
  status?: GameStatus;
  rating?: number | null;
  notes?: string;
  review?: string;
  completionPercent?: number;
  dateStarted?: string;
  dateCompleted?: string;
  platformId?: number;
}
```

#### IGDB Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/igdb/search` | Search IGDB for games |
| GET | `/igdb/game/:igdbId` | Get full game details from IGDB |
| GET | `/igdb/popular` | Get popular/trending games |
| GET | `/igdb/upcoming` | Get upcoming releases |

**GET /igdb/search - Query Parameters:**
```typescript
interface IgdbSearchParams {
  q: string;                  // Search query (required)
  limit?: number;             // Default: 10, Max: 50
}
```

#### Play Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/games/:gameId/sessions` | Get all sessions for a game |
| POST | `/games/:gameId/sessions` | Log a new play session |
| PATCH | `/sessions/:id` | Update a session |
| DELETE | `/sessions/:id` | Delete a session |

**POST /games/:gameId/sessions - Request Body:**
```typescript
interface CreateSessionDto {
  sessionDate: string;        // ISO date: "2024-01-15"
  durationMins: number;       // Duration in minutes
  notes?: string;
}
```

#### Custom Tags

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tags` | Get all custom tags |
| POST | `/tags` | Create a new tag |
| PATCH | `/tags/:id` | Update a tag |
| DELETE | `/tags/:id` | Delete a tag |
| POST | `/games/:gameId/tags/:tagId` | Add tag to game |
| DELETE | `/games/:gameId/tags/:tagId` | Remove tag from game |

#### Statistics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats/overview` | Get overall stats summary |
| GET | `/stats/by-status` | Games count by status |
| GET | `/stats/by-genre` | Playtime/count by genre |
| GET | `/stats/by-platform` | Playtime/count by platform |
| GET | `/stats/completion-history` | Games completed over time |
| GET | `/stats/playtime-history` | Playtime over time |

**GET /stats/overview - Response:**
```typescript
interface StatsOverview {
  totalGames: number;
  totalPlaytimeHours: number;
  averageRating: number;
  completionRate: number;       // Percentage
  currentlyPlaying: number;
  gamesCompletedThisYear: number;
  gamesCompletedThisMonth: number;
}
```

#### Platforms

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/platforms` | Get all platforms |
| GET | `/platforms/:id` | Get single platform |

#### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/health/ready` | Readiness check |


---

## 6. Frontend Component Architecture

### State Management Strategy

Using **Angular Signals** with a lightweight store pattern (similar to NgRx SignalStore):

```typescript
// Example: LibraryStore using signals
@Injectable({ providedIn: 'root' })
export class LibraryStore {
  // State signals
  private readonly _games = signal<UserGame[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _filters = signal<GameFilters>(defaultFilters);

  // Public selectors
  readonly games = this._games.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly filters = this._filters.asReadonly();

  // Computed signals
  readonly filteredGames = computed(() =>
    applyFilters(this._games(), this._filters())
  );
  readonly currentlyPlaying = computed(() =>
    this._games().filter(g => g.status === 'playing')
  );
  readonly totalGames = computed(() => this._games().length);

  // Actions
  async loadGames(): Promise<void> { ... }
  async addGame(dto: AddGameDto): Promise<void> { ... }
  async updateGame(id: number, dto: UpdateGameDto): Promise<void> { ... }
  setFilter(key: keyof GameFilters, value: any): void { ... }
}
```

### Component Hierarchy

```
app-root
├── app-header (standalone)
│   ├── logo
│   ├── nav-links
│   └── search-trigger
│
├── router-outlet
│   │
│   ├── dashboard (lazy)
│   │   ├── currently-playing-widget
│   │   │   └── game-card (compact)
│   │   ├── stats-summary-widget
│   │   ├── status-pie-chart
│   │   ├── playtime-bar-chart
│   │   └── recent-sessions-list
│   │
│   ├── library (lazy)
│   │   ├── game-filters-panel
│   │   │   ├── status-filter
│   │   │   ├── platform-filter
│   │   │   ├── genre-filter
│   │   │   ├── tag-filter
│   │   │   └── rating-filter
│   │   ├── sort-controls
│   │   ├── game-grid / game-list (toggle)
│   │   │   └── game-card (repeated)
│   │   └── pagination
│   │
│   ├── game-detail/:id (lazy)
│   │   ├── game-hero (cover, title, metadata)
│   │   ├── game-status-controls
│   │   │   ├── status-dropdown
│   │   │   ├── rating-input
│   │   │   └── progress-slider
│   │   ├── game-info-tabs
│   │   │   ├── overview-tab (IGDB data)
│   │   │   ├── notes-tab (editable)
│   │   │   └── review-tab (editable)
│   │   ├── play-sessions-section
│   │   │   ├── session-list
│   │   │   │   └── session-item (repeated)
│   │   │   └── add-session-dialog
│   │   └── tags-section
│   │
│   └── search (lazy)
│       ├── search-input (with debounce)
│       └── igdb-results-grid
│           └── igdb-game-card (repeated)
│               └── add-to-library-button
│
└── app-footer
```

### Shared Components

| Component | Description | Inputs | Outputs |
|-----------|-------------|--------|---------|
| `game-card` | Displays game info | `game`, `size: 'compact'|'full'` | `click`, `statusChange` |
| `rating-input` | 1-10 star rating | `value`, `readonly` | `valueChange` |
| `status-badge` | Colored status indicator | `status` | - |
| `status-dropdown` | Status selector | `value` | `valueChange` |
| `search-input` | Debounced search | `placeholder`, `debounceMs` | `search` |
| `loading-spinner` | Loading indicator | `size` | - |
| `empty-state` | Empty list placeholder | `message`, `icon` | `action` |
| `confirm-dialog` | Confirmation modal | `title`, `message` | `confirm`, `cancel` |
| `platform-icon` | Platform logo | `platform` | - |

### Routes Configuration

```typescript
// app.routes.ts
export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
    title: 'Dashboard - Backlogger'
  },
  {
    path: 'library',
    loadComponent: () => import('./features/library/library.component')
      .then(m => m.LibraryComponent),
    title: 'Library - Backlogger'
  },
  {
    path: 'games/:id',
    loadComponent: () => import('./features/game-detail/game-detail.component')
      .then(m => m.GameDetailComponent),
    title: 'Game Details - Backlogger'
  },
  {
    path: 'search',
    loadComponent: () => import('./features/search/search.component')
      .then(m => m.SearchComponent),
    title: 'Search - Backlogger'
  },
  { path: '**', redirectTo: 'dashboard' }
];
```

---

## 7. Service Layer Design

### Backend Services

#### IGDB Service
```typescript
@Injectable()
export class IgdbService {
  private accessToken: string;
  private tokenExpiry: Date;

  async search(query: string, limit?: number): Promise<IgdbGame[]>;
  async getGame(igdbId: number): Promise<IgdbGame>;
  async getPopular(limit?: number): Promise<IgdbGame[]>;
  async getUpcoming(limit?: number): Promise<IgdbGame[]>;

  private async authenticate(): Promise<void>;
  private async makeRequest<T>(endpoint: string, body: string): Promise<T>;
  private mapIgdbResponse(data: any): IgdbGame;
}
```

#### Games Service
```typescript
@Injectable()
export class GamesService {
  constructor(
    private readonly gameRepository: GameRepository,
    private readonly userGameRepository: UserGameRepository,
    private readonly igdbService: IgdbService,
  ) {}

  async findAll(filters: GameFilterDto): Promise<PaginatedResult<UserGameResponse>>;
  async findOne(id: number): Promise<UserGameResponse>;
  async create(dto: CreateGameDto): Promise<UserGameResponse>;
  async update(id: number, dto: UpdateGameDto): Promise<UserGameResponse>;
  async remove(id: number): Promise<void>;

  private async getOrCreateGame(igdbId: number): Promise<Game>;
  private updateTotalPlaytime(userGameId: number): Promise<void>;
}
```

#### Sessions Service
```typescript
@Injectable()
export class SessionsService {
  constructor(
    private readonly sessionRepository: PlaySessionRepository,
    private readonly userGameRepository: UserGameRepository,
  ) {}

  async findByGame(gameId: number): Promise<PlaySession[]>;
  async create(gameId: number, dto: CreateSessionDto): Promise<PlaySession>;
  async update(id: number, dto: UpdateSessionDto): Promise<PlaySession>;
  async remove(id: number): Promise<void>;
}
```

#### Stats Service
```typescript
@Injectable()
export class StatsService {
  constructor(
    private readonly userGameRepository: UserGameRepository,
    private readonly sessionRepository: PlaySessionRepository,
  ) {}

  async getOverview(): Promise<StatsOverview>;
  async getByStatus(): Promise<StatusStats[]>;
  async getByGenre(): Promise<GenreStats[]>;
  async getByPlatform(): Promise<PlatformStats[]>;
  async getCompletionHistory(months?: number): Promise<TimeSeriesData[]>;
  async getPlaytimeHistory(months?: number): Promise<TimeSeriesData[]>;
}
```

### Frontend Services

#### API Service (HTTP Client Wrapper)
```typescript
@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = inject(API_BASE_URL);
  private http = inject(HttpClient);

  get<T>(path: string, params?: HttpParams): Observable<T>;
  post<T>(path: string, body: any): Observable<T>;
  patch<T>(path: string, body: any): Observable<T>;
  delete<T>(path: string): Observable<T>;
}
```

#### Games API Service
```typescript
@Injectable({ providedIn: 'root' })
export class GamesApiService {
  private api = inject(ApiService);

  getGames(filters?: GameFilters): Observable<PaginatedResponse<Game>>;
  getGame(id: number): Observable<Game>;
  addGame(dto: AddGameDto): Observable<Game>;
  updateGame(id: number, dto: UpdateGameDto): Observable<Game>;
  deleteGame(id: number): Observable<void>;
}
```

#### IGDB API Service
```typescript
@Injectable({ providedIn: 'root' })
export class IgdbApiService {
  private api = inject(ApiService);

  search(query: string): Observable<IgdbGame[]>;
  getGame(igdbId: number): Observable<IgdbGame>;
  getPopular(): Observable<IgdbGame[]>;
}
```


---

## 8. Key Technical Decisions & Rationale

### Backend Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **ORM** | TypeORM | Mature, excellent TypeScript support, decorators align with NestJS patterns |
| **Validation** | class-validator + class-transformer | Native NestJS integration, declarative DTOs |
| **API Documentation** | @nestjs/swagger | Auto-generates OpenAPI spec from decorators |
| **Configuration** | @nestjs/config | Environment-based, type-safe config |
| **Caching** | In-memory (future: Redis) | Start simple, IGDB responses benefit from caching |
| **IGDB Client** | Custom service (axios) | IGDB uses Apicalypse query language, custom client is cleaner |
| **Error Handling** | Global exception filter | Consistent error responses across API |

### Frontend Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **State Management** | Signals + Stores | Angular 19's signals are reactive, simpler than RxJS for most cases |
| **Styling** | SCSS + CSS Variables | Variables for theming, SCSS for mixins/nesting |
| **UI Components** | Custom (no library) | Full control, minimal bundle size, good learning exercise |
| **Charts** | Chart.js (ng2-charts) | Lightweight, good Angular wrapper, sufficient for stats |
| **Icons** | Lucide Icons | Modern, tree-shakeable, MIT licensed |
| **Forms** | Reactive Forms | Type-safe, better for complex validation |
| **HTTP** | HttpClient + interceptors | Standard Angular approach, global error handling |

### Database Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Primary Key** | Serial integers | Simple, performant for single-user; UUIDs if multi-user later |
| **Game Data** | Cache IGDB data locally | Reduce API calls, offline-ready, faster queries |
| **Arrays** | PostgreSQL native arrays | Simpler than junction tables for genres/themes |
| **Timestamps** | All tables | Audit trail, useful for stats |

### API Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Versioning** | URL path (`/api/v1`) | Clear, explicit, easy to deprecate |
| **Pagination** | Offset-based | Simpler for UI, cursor-based if data grows |
| **Response Format** | Wrapped (`{ success, data, error }`) | Consistent, easier error handling |
| **Dates** | ISO 8601 strings | Standard, timezone-agnostic |

---

## 9. Development Phases & Milestones

### Phase 1: Foundation (Week 1-2)
**Goal:** Project setup, database, basic CRUD

- [ ] **1.1** Initialize monorepo structure
- [ ] **1.2** Set up NestJS backend with basic structure
- [ ] **1.3** Set up Angular frontend with routing
- [ ] **1.4** Configure Docker for PostgreSQL
- [ ] **1.5** Create database schema and migrations
- [ ] **1.6** Implement IGDB authentication service
- [ ] **1.7** Implement IGDB search endpoint
- [ ] **1.8** Create basic game entity and repository
- [ ] **1.9** Frontend: Implement API service layer
- [ ] **1.10** Frontend: Create search page with IGDB results

**Deliverable:** Can search IGDB and see results

### Phase 2: Core Library (Week 2-3)
**Goal:** Full game library management

- [ ] **2.1** Implement add game to library (from IGDB)
- [ ] **2.2** Create library list page with game cards
- [ ] **2.3** Implement game detail page (view)
- [ ] **2.4** Add status management (backlog, playing, etc.)
- [ ] **2.5** Implement rating system
- [ ] **2.6** Add notes/review functionality
- [ ] **2.7** Implement platform selection
- [ ] **2.8** Create filtering system (backend + frontend)
- [ ] **2.9** Implement sorting options
- [ ] **2.10** Add search within library
- [ ] **2.11** Implement delete game from library

**Deliverable:** Fully functional game library

### Phase 3: Sessions & Progress (Week 3-4)
**Goal:** Play session tracking

- [ ] **3.1** Create play session entity and repository
- [ ] **3.2** Implement session CRUD endpoints
- [ ] **3.3** Frontend: Add session list to game detail
- [ ] **3.4** Frontend: Create add/edit session dialog
- [ ] **3.5** Implement total playtime aggregation
- [ ] **3.6** Add completion percentage tracking
- [ ] **3.7** Auto-update dates (date_started, date_completed)

**Deliverable:** Can track play sessions

### Phase 4: Tags & Organization (Week 4)
**Goal:** Custom organization features

- [ ] **4.1** Create custom tags entity and repository
- [ ] **4.2** Implement tag CRUD endpoints
- [ ] **4.3** Implement tag assignment to games
- [ ] **4.4** Frontend: Tag management UI
- [ ] **4.5** Frontend: Filter by tags

**Deliverable:** Custom tagging system

### Phase 5: Statistics Dashboard (Week 4-5)
**Goal:** Visual statistics

- [ ] **5.1** Implement stats service with aggregation queries
- [ ] **5.2** Create stats endpoints
- [ ] **5.3** Frontend: Create dashboard layout
- [ ] **5.4** Implement status pie chart
- [ ] **5.5** Implement playtime by genre/platform charts
- [ ] **5.6** Add completion history timeline
- [ ] **5.7** Create "currently playing" widget
- [ ] **5.8** Add stats summary cards

**Deliverable:** Complete statistics dashboard

### Phase 6: Polish & Production Ready (Week 5-6)
**Goal:** Production quality

- [ ] **6.1** Implement comprehensive error handling
- [ ] **6.2** Add loading states and skeleton loaders
- [ ] **6.3** Responsive design polish
- [ ] **6.4** Performance optimization (lazy loading, caching)
- [ ] **6.5** Add OpenAPI/Swagger documentation
- [ ] **6.6** Write unit tests (backend)
- [ ] **6.7** Write component tests (frontend)
- [ ] **6.8** Write E2E tests (critical paths)
- [ ] **6.9** Environment configuration
- [ ] **6.10** Docker production setup
- [ ] **6.11** Documentation (README, setup guide)

**Deliverable:** Production-ready application

---

## 10. Testing Strategy

### Backend Testing

#### Unit Tests (Jest)
- **Services:** Mock repositories, test business logic
- **Controllers:** Mock services, test route handling
- **Repositories:** Test query builders (with in-memory DB or mocks)
- **IGDB Service:** Mock HTTP client, test response mapping

```typescript
// Example: GamesService unit test
describe('GamesService', () => {
  describe('create', () => {
    it('should fetch game from IGDB if not cached', async () => {
      igdbService.getGame.mockResolvedValue(mockIgdbGame);
      gameRepository.findByIgdbId.mockResolvedValue(null);
      gameRepository.create.mockResolvedValue(mockGame);

      const result = await service.create(createGameDto);

      expect(igdbService.getGame).toHaveBeenCalledWith(createGameDto.igdbId);
      expect(result.game.name).toBe(mockIgdbGame.name);
    });
  });
});
```

#### Integration Tests
- **API Endpoints:** Test full request/response cycle
- **Database:** Use test database with transactions (rollback after each test)

#### Test Coverage Goals
- Services: 80%+
- Controllers: 70%+
- Utilities: 90%+

### Frontend Testing

#### Unit Tests (Jest + Angular Testing Library)
- **Services:** Mock HttpClient, test method calls
- **Stores:** Test signal updates and computed values
- **Pipes/Directives:** Isolated unit tests

```typescript
// Example: LibraryStore unit test
describe('LibraryStore', () => {
  it('should filter games by status', () => {
    store.setGames([
      { id: 1, status: 'playing' },
      { id: 2, status: 'backlog' }
    ]);
    store.setFilter('status', 'playing');

    expect(store.filteredGames()).toHaveLength(1);
    expect(store.filteredGames()[0].id).toBe(1);
  });
});
```

#### Component Tests
- **Isolated:** Test component logic with mocked dependencies
- **Shallow:** Test template rendering with inputs/outputs

#### E2E Tests (Playwright)
- **Critical User Flows:**
  - Search IGDB and add game to library
  - Update game status and rating
  - Log a play session
  - Navigate between pages
  - Filter and sort library

### Test File Organization
```
apps/
├── api/
│   ├── src/
│   │   └── modules/games/
│   │       ├── games.service.ts
│   │       └── games.service.spec.ts    # Unit test next to source
│   └── test/
│       ├── games.e2e-spec.ts            # E2E tests
│       └── jest-e2e.json
│
└── web/
    ├── src/
    │   └── app/features/library/
    │       ├── library.component.ts
    │       └── library.component.spec.ts
    └── e2e/
        ├── library.spec.ts
        └── playwright.config.ts
```

---

## 11. Rollback Plan

### Database Rollbacks
- Use TypeORM migrations with `down()` methods
- Test rollback procedures before deploying

### Code Rollbacks
- Git revert for feature branches
- Feature flags for gradual rollouts (future)

### Data Safety
- Regular database backups (cron job)
- Soft deletes considered for user_games (optional)

---

## 12. File Changes Summary

### Files to Create

**Backend (apps/api/):**
- `src/main.ts` - Application bootstrap
- `src/app.module.ts` - Root module
- `src/config/*.ts` - Configuration files (4 files)
- `src/common/**/*.ts` - Filters, interceptors, decorators (~6 files)
- `src/database/**/*.ts` - Entities, repositories, migrations (~12 files)
- `src/modules/games/**/*.ts` - Games module (~8 files)
- `src/modules/igdb/**/*.ts` - IGDB module (~5 files)
- `src/modules/sessions/**/*.ts` - Sessions module (~6 files)
- `src/modules/stats/**/*.ts` - Stats module (~5 files)
- `src/modules/tags/**/*.ts` - Tags module (~5 files)
- `src/health/**/*.ts` - Health check (~2 files)

**Frontend (apps/web/):**
- `src/main.ts` - Bootstrap
- `src/app/app.*.ts` - Root component, config, routes
- `src/app/core/**/*.ts` - Services, models, interceptors (~10 files)
- `src/app/shared/**/*.ts` - Shared components, pipes (~15 files)
- `src/app/features/library/**/*.ts` - Library feature (~8 files)
- `src/app/features/game-detail/**/*.ts` - Detail feature (~10 files)
- `src/app/features/dashboard/**/*.ts` - Dashboard feature (~8 files)
- `src/app/features/search/**/*.ts` - Search feature (~5 files)
- `src/app/state/**/*.ts` - Global stores (~3 files)

**Infrastructure:**
- `docker/docker-compose.yml`
- `docker/docker-compose.dev.yml`
- `.env.example`
- `package.json` (root)
- `tsconfig.base.json`

**Total estimated files: ~100-120**

---

## 13. Estimated Effort

| Phase | Duration | Complexity |
|-------|----------|------------|
| Phase 1: Foundation | 1-2 weeks | Medium |
| Phase 2: Core Library | 1-2 weeks | Medium |
| Phase 3: Sessions | 0.5-1 week | Low |
| Phase 4: Tags | 0.5 week | Low |
| Phase 5: Statistics | 1 week | Medium |
| Phase 6: Polish | 1-2 weeks | Medium |

**Total: 5-8 weeks** (part-time, single developer)

### Complexity Assessment: **Medium**
- Well-defined scope
- Standard CRUD operations
- External API integration adds some complexity
- Statistics require aggregation queries
- No real-time features
- Single-user simplifies auth

---

## 14. Environment Configuration

### Environment Variables

```bash
# .env.example

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=backlogger
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres

# IGDB API
IGDB_CLIENT_ID=your_twitch_client_id
IGDB_CLIENT_SECRET=your_twitch_client_secret

# API
API_PORT=3000
API_PREFIX=/api/v1

# Frontend (built into Angular app)
# NG_APP_API_URL=http://localhost:3000/api/v1
```

### Docker Compose (Development)

```yaml
# docker/docker-compose.dev.yml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    container_name: backlogger-db
    environment:
      POSTGRES_DB: backlogger
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

---

## 15. Progress & Status

### ✅ Completed Features

| Feature | Status | Notes |
|---------|--------|-------|
| Project structure & setup | ✅ Done | Monorepo with NestJS + Angular 21 |
| Database schema | ✅ Done | PostgreSQL with TypeORM |
| IGDB integration | ✅ Done | Search & game details |
| Game library CRUD | ✅ Done | Add, update, remove games |
| Steam import | ✅ Done | Import full Steam library with playtime |
| Sorting & filtering | ✅ Done | By status, platform, name search, multiple sort options |
| Game detail page | ✅ Done | Edit status, rating, notes, completion % |
| Multi-platform support | ✅ Done | Same game on multiple platforms, grouped view |
| 100% completion trophy | ✅ Done | Trophy icon for fully completed games |
| Tailwind CSS | ✅ Done | Inline templates with Tailwind v3 |

### 🚧 In Progress / Next Up

| Feature | Priority | Effort |
|---------|----------|--------|
| Play sessions logging | High | Medium |
| Statistics dashboard | High | Medium |
| Custom tags | Medium | Low |
| GOG import | Medium | Medium |
| PlayStation import | Medium | Medium |

---

## 16. Future Roadmap

### Phase A: Platform Imports
- **GOG Galaxy** - Import GOG library
- **PlayStation** - PSN trophy/game data (requires auth)
- **Xbox** - Xbox Game Pass / owned games
- **Nintendo** - Limited API availability
- **Manual CSV import** - Generic fallback

### Phase B: User Profiles & Authentication
- **User accounts** - Email/password registration
- **OAuth providers** - Steam, Discord, Google login
- **Profile page** - Avatar, bio, gaming stats
- **Privacy settings** - Control what's visible

### Phase C: Social Features
- **Friends system** - Send/accept friend requests
- **Friend activity feed** - See what friends are playing
- **Compare libraries** - Find games in common
- **Game recommendations** - Based on friends' ratings

### Phase D: Advanced Features
- **PWA/Offline mode** - Service worker, IndexedDB
- **Achievements tracking** - Import from platforms
- **"Up Next" queue** - Tinder-like swipe to decide what to play
- **Game recommendations** - ML-based suggestions
- **Mobile app** - Capacitor or React Native

### Phase E: Community Features
- **Public profiles** - Shareable profile links
- **Reviews** - Public game reviews
- **Lists** - Curated game lists (Top 10 RPGs, etc.)
- **Backlog challenges** - Community events

---

## 17. Technical Debt & Improvements

### Backend
- [ ] Add proper database migrations (currently using synchronize: true)
- [ ] Add Redis caching for IGDB responses
- [ ] Add rate limiting
- [ ] Add request logging
- [ ] Add unit tests

### Frontend
- [ ] Extract reusable components (GameCard, StatusBadge, etc.)
- [ ] Add error boundaries
- [ ] Add skeleton loaders
- [ ] Add E2E tests with Playwright
- [ ] Add PWA manifest

---

## Quick Start Commands

```bash
# Clone and setup
git clone <repo>
cd backlogger

# Start database
docker-compose -f docker/docker-compose.dev.yml up -d

# Backend
cd apps/api
npm install
npm run migration:run
npm run start:dev

# Frontend (new terminal)
cd apps/web
npm install
npm start

# Open browser: http://localhost:4200
```

---

*Plan created: March 2026*
*Last updated: March 2026*
