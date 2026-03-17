import { Routes, CanDeactivateFn } from '@angular/router';
import type { ImportContainer } from './features/import/import.container';
import { authGuard, guestGuard } from './core/guards/auth.guard';

// Guard to prevent leaving import page during active import
const canDeactivateImport: CanDeactivateFn<ImportContainer> = (component) => {
  return component.canDeactivate();
};

export const routes: Routes = [
  { path: '', redirectTo: 'library', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component'),
    title: 'Sign In - Backlogger',
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component'),
    title: 'Create Account - Backlogger',
    canActivate: [guestGuard],
  },
  {
    path: 'library',
    loadComponent: () =>
      import('./features/library/library.container').then((m) => m.LibraryContainer),
    title: 'Library - Backlogger',
    canActivate: [authGuard],
  },
  {
    path: 'games/:id',
    loadComponent: () =>
      import('./features/game-detail/game-detail.container').then((m) => m.GameDetailContainer),
    title: 'Game Details - Backlogger',
    canActivate: [authGuard],
  },
  {
    path: 'search',
    loadComponent: () =>
      import('./features/search/search.container').then((m) => m.SearchContainer),
    title: 'Search - Backlogger',
    canActivate: [authGuard],
  },
  {
    path: 'import',
    loadComponent: () =>
      import('./features/import/import.container').then((m) => m.ImportContainer),
    title: 'Import from Steam - Backlogger',
    canActivate: [authGuard],
    canDeactivate: [canDeactivateImport],
  },
  {
    path: 'discover',
    loadComponent: () =>
      import('./features/discover/discover.container').then((m) => m.DiscoverContainer),
    title: 'What to Play? - Backlogger',
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'library' },
];
