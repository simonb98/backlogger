import { inject, computed } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { PlatformsService } from '../../core/services/platforms.service';

export const PLATFORMS_QUERY_KEY = 'platforms';

/**
 * Query for fetching all platforms
 */
export function injectPlatformsQuery() {
  const platformsService = inject(PlatformsService);

  return injectQuery(() => ({
    queryKey: [PLATFORMS_QUERY_KEY],
    queryFn: () => lastValueFrom(platformsService.getPlatforms()),
    staleTime: 1000 * 60 * 60, // 1 hour - platforms rarely change
  }));
}

/**
 * Helper to get platforms data with a default empty array
 */
export function injectPlatforms() {
  const query = injectPlatformsQuery();
  return computed(() => query.data() ?? []);
}

