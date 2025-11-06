'use client';

import { usePathname } from 'next/navigation';
import { AppBarWithAuth } from '@/app/components/AppBarWithAuth/AppBarWithAuth';
import { ThemeToggle } from '@/app/components/ThemeToggle/ThemeToggle';
import { SecondaryNav } from '@/app/components/SecondaryNav/SecondaryNav';
import { Footer } from '@/app/components/Footer/Footer';
import { Box } from '@/app/components/Box/Box';
import { appBarWithUserMenu, CanfarLogo, SRCNetLogo } from '@/stories/shared/navigation';
import { getPageTitle, getNavLinks } from '@/app/config/science-portal-routes';
import {
  DOCS_URL,
  ABOUT_URL,
  OPEN_SOURCE_URL,
  SUPPORT_EMAIL,
  DISCORD_URL,
  STORAGE_MANAGEMENT_URL,
  GROUP_MANAGEMENT_URL,
  DATA_PUBLICATION_URL,
  SCIENCE_PORTAL_URL,
  CADC_SEARCH_URL,
  OPENSTACK_CLOUD_URL,
} from '@/lib/config/site-config';

/**
 * Science Portal Layout
 *
 * Shared layout for all /science-portal/* routes.
 * Provides consistent navigation structure with:
 * - Main AppBar (sticky at top)
 * - Secondary navigation (sticky below main nav)
 * - Page content
 * - Footer (CANFAR mode only)
 */
export default function SciencePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isOIDCMode = process.env.NEXT_PUBLIC_USE_CANFAR !== 'true';

  // Get page title and navigation links based on current path
  const pageTitle = getPageTitle(pathname);
  const navLinks = getNavLinks(pathname);

  const footerSections = [
    {
      title: 'Resources',
      links: [
        { label: 'Documentation', href: DOCS_URL, external: true },
        { label: 'About', href: ABOUT_URL, external: true },
        { label: 'Open Source', href: OPEN_SOURCE_URL, external: true },
      ],
    },
    {
      title: 'Services',
      links: [
        { label: 'Storage Management', href: STORAGE_MANAGEMENT_URL, external: true },
        { label: 'Group Management', href: GROUP_MANAGEMENT_URL, external: true },
        { label: 'Data Publication', href: DATA_PUBLICATION_URL, external: true },
        { label: 'Science Portal', href: SCIENCE_PORTAL_URL, external: true },
        { label: 'CADC Search', href: CADC_SEARCH_URL, external: true },
        { label: 'OpenStack Cloud', href: OPENSTACK_CLOUD_URL, external: true },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Help', href: SUPPORT_EMAIL, external: false },
        { label: 'Join us on Discord', href: DISCORD_URL, external: true },
      ],
    },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'background.default',
      }}
    >
      {/* Main AppBar - Sticky at top */}
      <AppBarWithAuth
        variant="surface"
        position="sticky"
        elevation={0}
        wordmark="Science Portal"
        logoHref="/"
        logo={isOIDCMode ? <SRCNetLogo /> : <CanfarLogo />}
        links={isOIDCMode ? [] : appBarWithUserMenu.links}
        accountButton={<ThemeToggle size="md" />}
        showLoginButton={true}
      />

      {/* Secondary Navigation - Sticky below main nav */}
      <SecondaryNav
        title={pageTitle}
        links={navLinks}
        variant="surface"
      />

      {/* Main content area */}
      <Box component="main" sx={{ flex: 1 }}>
        {children}
      </Box>

      {/* Footer - CANFAR mode only */}
      {!isOIDCMode && (
        <Footer
          sections={footerSections}
          copyright="© 2022-2025"
        />
      )}
    </Box>
  );
}
