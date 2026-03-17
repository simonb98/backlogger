import { Routes, CanDeactivateFn } from '@angular/router';
import type { ImportContainer } from './features/import/import.container';

// Guard to prevent leaving import page during active import
const canDeactivateImport: CanDeactivateFn<ImportContainer> = (component) => {
  return component.canDeactivate();
};

export const routes: Routes = [
  { path: '', redirectTo: 'library', pathMatch: 'full' },
  {
    path: 'library',
    loadComponent: () =>
      import('./features/library/library.container').then((m) => m.LibraryContainer),
    title: 'Library - Backlogger',
  },
  {
    path: 'games/:id',
    loadComponent: () =>
      import('./features/game-detail/game-detail.container').then((m) => m.GameDetailContainer),
    title: 'Game Details - Backlogger',
  },
  {
    path: 'search',
    loadComponent: () =>
      import('./features/search/search.container').then((m) => m.SearchContainer),
    title: 'Search - Backlogger',
  },
  {
    path: 'import',
    loadComponent: () =>
      import('./features/import/import.container').then((m) => m.ImportContainer),
    title: 'Import from Steam - Backlogger',
    canDeactivate: [canDeactivateImport],
  },
  {
    path: 'discover',
    loadComponent: () =>
      import('./features/discover/discover.container').then((m) => m.DiscoverContainer),
    title: 'What to Play? - Backlogger',
  },
  { path: '**', redirectTo: 'library' },
];
