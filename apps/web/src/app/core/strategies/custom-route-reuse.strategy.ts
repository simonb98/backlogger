import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from '@angular/router';

interface RouteStorageObject {
  handle: DetachedRouteHandle;
  scrollPosition: number;
}

export class CustomRouteReuseStrategy implements RouteReuseStrategy {
  private storedRoutes: { [key: string]: RouteStorageObject } = {};
  private currentScrollPosition = 0;

  constructor() {
    window.addEventListener('scroll', () => {
      this.currentScrollPosition = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    });
  }

  // Determine if a route should be detached and stored
  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    return route.routeConfig?.path === 'library';
  }

  // Store the detached route
  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    if (route.routeConfig?.path && handle) {
      this.storedRoutes[route.routeConfig.path] = {
        handle,
        scrollPosition: this.currentScrollPosition
      };
    }
  }

  // Determine if a route should be attached
  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    return !!route.routeConfig?.path && !!this.storedRoutes[route.routeConfig.path];
  }

  // Retrieve the stored route
  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    if (!route.routeConfig?.path) return null;
    const stored = this.storedRoutes[route.routeConfig.path];

    if (stored) {
      // Restore scroll position after a short delay to allow DOM to attach
      setTimeout(() => {
        window.requestAnimationFrame(() => {
          window.scrollTo({ top: stored.scrollPosition, behavior: 'instant' });
        });
      }, 10);
      return stored.handle;
    }

    return null;
  }

  // Determine if a route should be reused
  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    return future.routeConfig === curr.routeConfig;
  }
}
