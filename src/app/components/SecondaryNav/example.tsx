/**
 * SecondaryNav Component - Usage Examples
 *
 * This file contains practical examples of how to use the SecondaryNav component
 * in different scenarios. These examples can be copied and adapted for your needs.
 */

'use client';

import { SecondaryNav } from './SecondaryNav';
import type { SecondaryNavLink } from './types';

// ============================================================================
// Example 1: Basic Usage with Static Links
// ============================================================================

export function BasicSecondaryNavExample() {
  const links: SecondaryNavLink[] = [
    { label: 'Overview', href: '/dashboard', active: true },
    { label: 'Analytics', href: '/dashboard/analytics' },
    { label: 'Reports', href: '/dashboard/reports' },
  ];

  return (
    <SecondaryNav
      title="Dashboard"
      links={links}
      variant="surface"
    />
  );
}

// ============================================================================
// Example 2: With Dynamic Active State (Next.js App Router)
// ============================================================================

import { usePathname } from 'next/navigation';

export function DynamicSecondaryNavExample() {
  const pathname = usePathname();

  const links: SecondaryNavLink[] = [
    {
      label: 'Overview',
      href: '/dashboard',
      active: pathname === '/dashboard'
    },
    {
      label: 'Analytics',
      href: '/dashboard/analytics',
      active: pathname.startsWith('/dashboard/analytics')
    },
    {
      label: 'Reports',
      href: '/dashboard/reports',
      active: pathname.startsWith('/dashboard/reports')
    },
    {
      label: 'Settings',
      href: '/dashboard/settings',
      active: pathname.startsWith('/dashboard/settings')
    },
  ];

  return (
    <SecondaryNav
      title="Dashboard"
      links={links}
    />
  );
}

// ============================================================================
// Example 3: Primary Variant (Colored Background)
// ============================================================================

export function PrimaryVariantExample() {
  const links: SecondaryNavLink[] = [
    { label: 'Home', href: '/', active: true },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <SecondaryNav
      title="My Application"
      links={links}
      variant="primary"
    />
  );
}

// ============================================================================
// Example 4: Dark Variant
// ============================================================================

export function DarkVariantExample() {
  const links: SecondaryNavLink[] = [
    { label: 'Projects', href: '/projects', active: true },
    { label: 'Team', href: '/team' },
    { label: 'Resources', href: '/resources' },
  ];

  return (
    <SecondaryNav
      title="Workspace"
      links={links}
      variant="dark"
    />
  );
}

// ============================================================================
// Example 5: With Custom Styling
// ============================================================================

export function CustomStyledExample() {
  const links: SecondaryNavLink[] = [
    { label: 'Overview', href: '/admin', active: true },
    { label: 'Users', href: '/admin/users' },
    { label: 'Settings', href: '/admin/settings' },
  ];

  return (
    <SecondaryNav
      title="Admin Panel"
      links={links}
      sx={{
        top: '80px', // Custom top position
        borderBottom: '2px solid',
        borderColor: 'primary.main',
        boxShadow: 2,
      }}
    />
  );
}

// ============================================================================
// Example 6: In a Layout Component (Recommended Pattern)
// ============================================================================

import { ReactNode } from 'react';
import { AppBarWithAuth } from '@/app/components/AppBarWithAuth/AppBarWithAuth';
import { Container } from '@mui/material';
import { Box } from '@/app/components/Box/Box';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayoutExample({ children }: DashboardLayoutProps) {
  const pathname = usePathname();

  // Define navigation structure
  const navLinks: SecondaryNavLink[] = [
    {
      label: 'Overview',
      href: '/dashboard',
      active: pathname === '/dashboard'
    },
    {
      label: 'Analytics',
      href: '/dashboard/analytics',
      active: pathname.startsWith('/dashboard/analytics')
    },
    {
      label: 'Reports',
      href: '/dashboard/reports',
      active: pathname.startsWith('/dashboard/reports')
    },
    {
      label: 'Settings',
      href: '/dashboard/settings',
      active: pathname.startsWith('/dashboard/settings')
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Main AppBar */}
      <AppBarWithAuth
        variant="surface"
        position="sticky"
        wordmark="Science Portal"
      />

      {/* Secondary Navigation - sits below main AppBar */}
      <SecondaryNav
        title="Dashboard"
        links={navLinks}
        variant="surface"
      />

      {/* Main Content Area */}
      <Box component="main" sx={{ flex: 1, pt: 3 }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
}

// ============================================================================
// Example 7: With Conditional Links (Based on User Permissions)
// ============================================================================

interface UserPermissions {
  canViewReports: boolean;
  canManageSettings: boolean;
}

export function ConditionalLinksExample({ permissions }: { permissions: UserPermissions }) {
  const pathname = usePathname();

  // Build links array conditionally
  const links: SecondaryNavLink[] = [
    {
      label: 'Overview',
      href: '/dashboard',
      active: pathname === '/dashboard'
    },
    {
      label: 'Analytics',
      href: '/dashboard/analytics',
      active: pathname.startsWith('/dashboard/analytics')
    },
    // Only show Reports if user has permission
    ...(permissions.canViewReports ? [{
      label: 'Reports',
      href: '/dashboard/reports',
      active: pathname.startsWith('/dashboard/reports')
    }] : []),
    // Only show Settings if user has permission
    ...(permissions.canManageSettings ? [{
      label: 'Settings',
      href: '/dashboard/settings',
      active: pathname.startsWith('/dashboard/settings')
    }] : []),
  ];

  return (
    <SecondaryNav
      title="Dashboard"
      links={links}
    />
  );
}

// ============================================================================
// Example 8: Transparent Variant (For Hero Sections)
// ============================================================================

export function TransparentVariantExample() {
  const links: SecondaryNavLink[] = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Docs', href: '/docs' },
  ];

  return (
    <SecondaryNav
      title="Product"
      links={links}
      variant="transparent"
    />
  );
}

// ============================================================================
// Example 9: With Many Links (Responsive Behavior)
// ============================================================================

export function ManyLinksExample() {
  const pathname = usePathname();

  const links: SecondaryNavLink[] = [
    { label: 'Overview', href: '/portal', active: pathname === '/portal' },
    { label: 'Sessions', href: '/portal/sessions', active: pathname.startsWith('/portal/sessions') },
    { label: 'Storage', href: '/portal/storage', active: pathname.startsWith('/portal/storage') },
    { label: 'Analytics', href: '/portal/analytics', active: pathname.startsWith('/portal/analytics') },
    { label: 'Reports', href: '/portal/reports', active: pathname.startsWith('/portal/reports') },
    { label: 'Settings', href: '/portal/settings', active: pathname.startsWith('/portal/settings') },
  ];

  return (
    <SecondaryNav
      title="Science Portal"
      links={links}
    />
  );
}

// ============================================================================
// Example 10: Complete Page Example
// ============================================================================

export function CompletePage() {
  const pathname = usePathname();

  const links: SecondaryNavLink[] = [
    { label: 'Overview', href: '/dashboard', active: pathname === '/dashboard' },
    { label: 'Analytics', href: '/dashboard/analytics', active: pathname.startsWith('/dashboard/analytics') },
    { label: 'Reports', href: '/dashboard/reports', active: pathname.startsWith('/dashboard/reports') },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Main Navigation */}
      <AppBarWithAuth
        variant="surface"
        position="sticky"
        wordmark="My App"
      />

      {/* Secondary Navigation */}
      <SecondaryNav
        title="Dashboard"
        links={links}
        variant="surface"
      />

      {/* Page Content */}
      <Box component="main" sx={{ flex: 1, pt: 3, backgroundColor: 'background.default' }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
          {/* Your page content goes here */}
          <Box sx={{ py: 4 }}>
            <h2>Welcome to the Dashboard</h2>
            <p>This is an example of a complete page with SecondaryNav.</p>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
