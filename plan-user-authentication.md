# User Authentication Implementation Plan

## Overview

Add JWT-based authentication to Backlogger with user accounts, allowing each user to have their own game library. This transforms the application from single-user to multi-user.

### Goals
- User registration and login with email/password
- JWT tokens for stateless authentication  
- Per-user game libraries (UserGame associated with User)
- Protected routes on both backend and frontend
- Seamless migration of existing data

### Scope Boundaries
- **Included**: Email/password auth, JWT, route protection, user-scoped data
- **Excluded**: OAuth (Google/Discord), password reset, email verification, refresh tokens (MVP)

---

## 1. Prerequisites

### Backend Dependencies (apps/api)
```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt passport-local bcrypt
npm install -D @types/bcrypt @types/passport-jwt @types/passport-local
```

### Environment Variables
```env
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRATION=7d
```

---

## 2. Database Changes

### Step 2.1: Create User Entity

**File: `apps/api/src/database/entities/user.entity.ts`**

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255 })
  password: string;  // bcrypt hashed

  @Column({ length: 100, nullable: true })
  displayName?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => UserGame, (userGame) => userGame.user)
  userGames: UserGame[];

  @OneToMany(() => CustomTag, (tag) => tag.user)
  tags: CustomTag[];
}
```

### Step 2.2: Add User FK to UserGame Entity

**Modify: `apps/api/src/database/entities/user-game.entity.ts`**

Add user relationship:
```typescript
@Index()
@ManyToOne(() => User, (user) => user.userGames, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'user_id' })
user: User;

@Column({ name: 'user_id' })
userId: number;
```

Update unique constraint from `['game', 'platform']` to `['user', 'game', 'platform']`.

### Step 2.3: Add User FK to CustomTag Entity

**Modify: `apps/api/src/database/entities/custom-tag.entity.ts`**

Tags should be per-user:
```typescript
@ManyToOne(() => User, (user) => user.tags, { onDelete: 'CASCADE' })
@JoinColumn({ name: 'user_id' })
user: User;

@Column({ name: 'user_id' })
userId: number;
```

### Step 2.4: Export User Entity

**Modify: `apps/api/src/database/entities/index.ts`** - Add User export

### Step 2.5: Update TypeORM Config

**Modify: `apps/api/src/app.module.ts`** - Add User to entities array

---

## 3. Backend Auth Module

### Step 3.1: Create Auth Config

**File: `apps/api/src/config/auth.config.ts`**
```typescript
export const authConfig = registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiration: process.env.JWT_EXPIRATION || '7d',
}));
```

### Step 3.2: Create Auth DTOs

**File: `apps/api/src/modules/auth/dto/register.dto.ts`**
```typescript
export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  displayName?: string;
}
```

**File: `apps/api/src/modules/auth/dto/login.dto.ts`**
```typescript
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
```

### Step 3.3: Create Auth Service

**File: `apps/api/src/modules/auth/auth.service.ts`**

Key methods:
- `register(dto: RegisterDto)` - Hash password, create user, return JWT
- `login(dto: LoginDto)` - Validate credentials, return JWT
- `validateUser(email, password)` - For Passport local strategy
- `generateToken(user)` - Create JWT with user payload

### Step 3.4: Create JWT Strategy

**File: `apps/api/src/modules/auth/strategies/jwt.strategy.ts`**
```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('auth.jwtSecret'),
    });
  }

  validate(payload: { sub: number; email: string }) {
    return { id: payload.sub, email: payload.email };
  }
}
```

### Step 3.5: Create Auth Guards

**File: `apps/api/src/modules/auth/guards/jwt-auth.guard.ts`**
```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

### Step 3.6: Create User Decorator

**File: `apps/api/src/modules/auth/decorators/current-user.decorator.ts`**
```typescript
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

### Step 3.7: Create Auth Controller

**File: `apps/api/src/modules/auth/auth.controller.ts`**

Endpoints:
- `POST /auth/register` - Create account
- `POST /auth/login` - Get JWT token
- `GET /auth/me` - Get current user (protected)

### Step 3.8: Create Auth Module

**File: `apps/api/src/modules/auth/auth.module.ts`**
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('auth.jwtSecret'),
        signOptions: { expiresIn: config.get('auth.jwtExpiration') },
      }),
    }),
    PassportModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

### Step 3.9: Register Auth Module in App

**Modify: `apps/api/src/app.module.ts`** - Import AuthModule, add authConfig to config load

---

## 4. Update Existing Services for Multi-User

### Step 4.1: Update GamesService

**Modify: `apps/api/src/modules/games/games.service.ts`**

- Add `userId` parameter to all methods
- Filter queries by `userId`
- `findAll(userId, filters)` - Add `where: { userId }` to query
- `create(userId, dto)` - Set `userId` on new UserGame
- `findOne(userId, id)` - Verify ownership

### Step 4.2: Update GamesController

**Modify: `apps/api/src/modules/games/games.controller.ts`**

- Add `@UseGuards(JwtAuthGuard)` to class
- Use `@CurrentUser()` decorator to get user
- Pass `user.id` to service methods

### Step 4.3: Update TagsService and Controller

Apply same pattern - filter by userId, protect with guard.

### Step 4.4: Update SessionsService and Controller

Apply same pattern - verify UserGame belongs to user.

### Step 4.5: Update SteamImportService

Pass userId when creating UserGame entries during import.

---

## 5. Frontend Auth Service

### Step 5.1: Create Auth Types

**File: `apps/web/src/app/core/models/auth.model.ts`**
```typescript
export interface User {
  id: number;
  email: string;
  displayName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}
```

### Step 5.2: Create Auth Service

**File: `apps/web/src/app/core/services/auth.service.ts`**
```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser = signal<User | null>(null);
  private token = signal<string | null>(null);

  user = this.currentUser.asReadonly();
  isAuthenticated = computed(() => this.token() !== null);

  login(credentials: LoginRequest): Observable<AuthResponse>;
  register(data: RegisterRequest): Observable<AuthResponse>;
  logout(): void;
  loadStoredToken(): void;  // Called on app init
}
```

### Step 5.3: Create Auth Interceptor

**File: `apps/web/src/app/core/interceptors/auth.interceptor.ts`**
```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
```

### Step 5.4: Register Interceptor

**Modify: `apps/web/src/app/app.config.ts`**
```typescript
provideHttpClient(withInterceptors([authInterceptor]))
```

---

## 6. Frontend Auth Components

### Step 6.1: Create Login Component

**File: `apps/web/src/app/features/auth/login/login.component.ts`**

- Email/password form with validation
- Submit calls authService.login()
- On success, redirect to /library
- Show error messages

### Step 6.2: Create Register Component

**File: `apps/web/src/app/features/auth/register/register.component.ts`**

- Email/password/displayName form
- Password confirmation field
- Submit calls authService.register()
- On success, redirect to /library

### Step 6.3: Create Auth Guard

**File: `apps/web/src/app/core/guards/auth.guard.ts`**
```typescript
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
```

### Step 6.4: Update Routes

**Modify: `apps/web/src/app/app.routes.ts`**
```typescript
export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component') },
  { path: 'register', loadComponent: () => import('./features/auth/register/register.component') },
  { path: '', redirectTo: 'library', pathMatch: 'full' },
  {
    path: 'library',
    loadComponent: () => import('./features/library/library.container'),
    canActivate: [authGuard],
  },
  // ... apply authGuard to all protected routes
];
```

### Step 6.5: Add User Menu to Header

**Modify: `apps/web/src/app/app.ts`** (or create navbar component)

- Show user email/displayName when logged in
- Logout button
- Show Login/Register links when logged out

---

## 7. Shared Types

**File: `libs/shared/types/auth.types.ts`**
```typescript
export interface User {
  id: number;
  email: string;
  displayName?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  displayName?: string;
}
```

---

## 8. Migration Strategy

### Option A: Auto-assign to First User (Recommended for Personal Use)

1. Run migration to add nullable `user_id` column
2. Create a default admin user on first app start
3. Update all existing records to use this user's ID
4. Make `user_id` NOT NULL

### Option B: Clean Slate

1. Add `user_id` column with NOT NULL and FK
2. Existing data will be lost (acceptable if dev environment)

### Migration Script (Option A)

```sql
-- 1. Add nullable user_id columns
ALTER TABLE user_games ADD COLUMN user_id INTEGER REFERENCES users(id);
ALTER TABLE custom_tags ADD COLUMN user_id INTEGER REFERENCES users(id);

-- 2. After creating first user with ID 1:
UPDATE user_games SET user_id = 1 WHERE user_id IS NULL;
UPDATE custom_tags SET user_id = 1 WHERE user_id IS NULL;

-- 3. Make columns required
ALTER TABLE user_games ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE custom_tags ALTER COLUMN user_id SET NOT NULL;

-- 4. Update unique constraint
ALTER TABLE user_games DROP CONSTRAINT IF EXISTS user_games_game_id_platform_id_key;
ALTER TABLE user_games ADD CONSTRAINT user_games_user_game_platform_unique
  UNIQUE (user_id, game_id, platform_id);
```

---

## File Changes Summary

### New Files
| Location | Description |
|----------|-------------|
| `apps/api/src/database/entities/user.entity.ts` | User entity |
| `apps/api/src/config/auth.config.ts` | JWT config |
| `apps/api/src/modules/auth/auth.module.ts` | Auth module |
| `apps/api/src/modules/auth/auth.service.ts` | Auth business logic |
| `apps/api/src/modules/auth/auth.controller.ts` | Login/register endpoints |
| `apps/api/src/modules/auth/dto/*.ts` | Request DTOs |
| `apps/api/src/modules/auth/strategies/jwt.strategy.ts` | JWT validation |
| `apps/api/src/modules/auth/guards/jwt-auth.guard.ts` | Route protection |
| `apps/api/src/modules/auth/decorators/current-user.decorator.ts` | User injection |
| `apps/web/src/app/core/models/auth.model.ts` | Auth types |
| `apps/web/src/app/core/services/auth.service.ts` | Auth state & API |
| `apps/web/src/app/core/interceptors/auth.interceptor.ts` | Token injection |
| `apps/web/src/app/core/guards/auth.guard.ts` | Route protection |
| `apps/web/src/app/features/auth/login/*.ts` | Login page |
| `apps/web/src/app/features/auth/register/*.ts` | Register page |
| `libs/shared/types/auth.types.ts` | Shared auth types |

### Modified Files
| Location | Changes |
|----------|---------|
| `apps/api/src/database/entities/user-game.entity.ts` | Add user FK |
| `apps/api/src/database/entities/custom-tag.entity.ts` | Add user FK |
| `apps/api/src/database/entities/index.ts` | Export User |
| `apps/api/src/app.module.ts` | Add User entity, AuthModule, authConfig |
| `apps/api/src/modules/games/games.service.ts` | Filter by userId |
| `apps/api/src/modules/games/games.controller.ts` | Add guards, CurrentUser |
| `apps/api/src/modules/tags/*.ts` | Add user scoping |
| `apps/api/src/modules/sessions/*.ts` | Add user verification |
| `apps/api/src/modules/steam/steam-import.service.ts` | Pass userId |
| `apps/web/src/app/app.config.ts` | Add auth interceptor |
| `apps/web/src/app/app.routes.ts` | Add auth routes, guards |
| `apps/web/src/app/app.ts` | Add user menu/logout |
| `libs/shared/types/index.ts` | Export auth types |

---

## Testing Strategy

### Backend Unit Tests
- `auth.service.spec.ts`: Register, login, password validation
- `jwt.strategy.spec.ts`: Token validation, expiry

### Backend E2E Tests
- Register flow, login flow, protected route access
- Verify users can only see their own games

### Frontend Tests
- Auth service: login/logout/token storage
- Auth guard: redirect behavior
- Login/register forms: validation, submission

### Manual Testing
1. Register new account → verify JWT returned
2. Login with credentials → verify JWT works
3. Access /library without token → redirected to login
4. Add game → verify only visible to that user
5. Create second user → verify separate libraries

---

## Estimated Effort

| Phase | Time | Complexity |
|-------|------|------------|
| Database changes | 1-2 hours | Low |
| Backend auth module | 3-4 hours | Medium |
| Update existing services | 2-3 hours | Medium |
| Frontend auth service | 2 hours | Low |
| Login/Register UI | 2-3 hours | Low |
| Route guards & integration | 1-2 hours | Low |
| Testing & debugging | 2-3 hours | Medium |
| **Total** | **~15-20 hours** | **Medium** |

---

## Rollback Plan

1. **Code**: Revert commits for auth feature
2. **Database**:
   - Drop `user_id` columns from user_games, custom_tags
   - Drop users table
   - Restore original unique constraint on user_games
3. **Frontend**: Remove auth interceptor, guards, routes

---

## Future Enhancements (Out of Scope)

- Refresh tokens for better security
- Password reset via email
- Email verification
- OAuth providers (Google, Discord, Steam)
- Remember me functionality
- Session management (logout all devices)

