export interface RouteConfig {
  path: string;
  title: string;
  navLabel: string;
}

export const SCIENCE_PORTAL_ROUTES: Record<string, RouteConfig> = {
  DASHBOARD: {
    path: '/science-portal',
    title: 'Dashboard',
    navLabel: 'Dashboard',
  },
  STORAGE: {
    path: '/science-portal/storage',
    title: 'VO Space Storage',
    navLabel: 'Storage',
  },
  SEARCH: {
    path: '/science-portal/search',
    title: 'StarAI Search',
    navLabel: 'Search',
  },
  CODE: {
    path: '/science-portal/code',
    title: 'StarAI Code Runner',
    navLabel: 'Code Runner',
  },
} as const;

export type SciencePortalRoute = typeof SCIENCE_PORTAL_ROUTES[keyof typeof SCIENCE_PORTAL_ROUTES]['path'];

/**
 * Get page title from pathname
 */
export function getPageTitle(pathname: string): string {
  const route = Object.values(SCIENCE_PORTAL_ROUTES).find(
    (r) => r.path === pathname
  );
  return route?.title || 'Dashboard';
}

/**
 * Get navigation links with active state
 */
export function getNavLinks(currentPath: string) {
  return Object.values(SCIENCE_PORTAL_ROUTES).map((route) => ({
    label: route.navLabel,
    href: route.path,
    active: currentPath === route.path,
  }));
}
