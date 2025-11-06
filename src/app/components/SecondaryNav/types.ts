import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Represents a navigation link in the SecondaryNav component.
 */
export interface SecondaryNavLink {
  /**
   * The display text for the link
   */
  label: string;

  /**
   * The URL or path for the link
   */
  href: string;

  /**
   * Whether this link represents the currently active page
   * @default false
   */
  active?: boolean;
}

/**
 * Props for the SecondaryNav component.
 *
 * SecondaryNav provides a sticky sub-navigation bar that sits below the main AppBar.
 * It displays a page title and navigation links with support for different visual variants.
 *
 * @example
 * ```tsx
 * <SecondaryNav
 *   title="Dashboard"
 *   links={[
 *     { label: 'Overview', href: '/dashboard', active: true },
 *     { label: 'Analytics', href: '/dashboard/analytics' },
 *     { label: 'Reports', href: '/dashboard/reports' }
 *   ]}
 *   variant="surface"
 * />
 * ```
 */
export interface SecondaryNavProps {
  /**
   * The page title to display on the left side
   */
  title: string;

  /**
   * Array of navigation links to display on the right side
   */
  links: SecondaryNavLink[];

  /**
   * Visual variant for the navigation bar
   * - 'surface': Background paper color with divider border (default)
   * - 'primary': Primary theme color background
   * - 'transparent': Transparent background
   * - 'dark': Dark background regardless of theme mode
   * @default 'surface'
   */
  variant?: 'surface' | 'primary' | 'transparent' | 'dark';

  /**
   * Additional MUI sx props for custom styling
   */
  sx?: SxProps<Theme>;
}
