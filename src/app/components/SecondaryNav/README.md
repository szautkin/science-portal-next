# SecondaryNav Component

A sticky secondary navigation bar that sits below the main AppBar, providing page-level navigation and context.

## Overview

The `SecondaryNav` component is a TypeScript-first, responsive navigation component built with Material-UI and designed to work seamlessly with the existing design system. It provides a clean, accessible way to display page titles and navigation links with support for multiple visual variants.

## Features

- **Sticky Positioning**: Automatically positions below the main AppBar (top: 64px)
- **Type-Safe**: Comprehensive TypeScript interfaces with JSDoc documentation
- **Responsive Design**: Mobile-first approach with MUI breakpoints
- **Multiple Variants**: Support for surface, primary, transparent, and dark color schemes
- **Active Link Highlighting**: Visual indication of the current page
- **Smooth Transitions**: Hover and active state animations
- **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation, and focus states
- **Theme Integration**: Uses MUI theme tokens for consistent styling

## Installation

The component is already part of the project structure. Import it using:

```typescript
import { SecondaryNav } from '@/app/components/SecondaryNav';
import type { SecondaryNavLink, SecondaryNavProps } from '@/app/components/SecondaryNav';
```

## Usage

### Basic Example

```tsx
import { SecondaryNav } from '@/app/components/SecondaryNav';

export default function DashboardPage() {
  return (
    <>
      <SecondaryNav
        title="Dashboard"
        links={[
          { label: 'Overview', href: '/dashboard', active: true },
          { label: 'Analytics', href: '/dashboard/analytics' },
          { label: 'Reports', href: '/dashboard/reports' },
        ]}
      />

      {/* Page content */}
    </>
  );
}
```

### With Different Variants

```tsx
// Surface variant (default) - paper background with divider
<SecondaryNav
  title="Dashboard"
  links={links}
  variant="surface"
/>

// Primary variant - uses primary theme color
<SecondaryNav
  title="Dashboard"
  links={links}
  variant="primary"
/>

// Transparent variant - transparent background
<SecondaryNav
  title="Dashboard"
  links={links}
  variant="transparent"
/>

// Dark variant - dark background
<SecondaryNav
  title="Dashboard"
  links={links}
  variant="dark"
/>
```

### With Custom Styling

```tsx
<SecondaryNav
  title="Dashboard"
  links={links}
  sx={{
    top: '80px', // Custom positioning
    borderBottom: '2px solid',
    borderColor: 'primary.main',
  }}
/>
```

### Dynamic Active State

```tsx
'use client';

import { usePathname } from 'next/navigation';
import { SecondaryNav } from '@/app/components/SecondaryNav';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();

  const links = [
    {
      label: 'Overview',
      href: '/dashboard',
      active: pathname === '/dashboard'
    },
    {
      label: 'Analytics',
      href: '/dashboard/analytics',
      active: pathname === '/dashboard/analytics'
    },
    {
      label: 'Reports',
      href: '/dashboard/reports',
      active: pathname === '/dashboard/reports'
    },
  ];

  return (
    <>
      <SecondaryNav title="Dashboard" links={links} />
      {children}
    </>
  );
}
```

## API

### SecondaryNavProps

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `title` | `string` | Required | The page title displayed on the left side |
| `links` | `SecondaryNavLink[]` | Required | Array of navigation links |
| `variant` | `'surface' \| 'primary' \| 'transparent' \| 'dark'` | `'surface'` | Visual variant for the navigation bar |
| `sx` | `SxProps<Theme>` | `undefined` | Additional MUI sx props for custom styling |

### SecondaryNavLink

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `label` | `string` | Required | The display text for the link |
| `href` | `string` | Required | The URL or path for the link |
| `active` | `boolean` | `false` | Whether this link represents the currently active page |

## Design Specifications

### Layout

- **AppBar**: Sticky positioning with `top: 64px`
- **Z-Index**: `theme.zIndex.appBar - 1` (1099)
- **Toolbar**: Minimum height of 48px (xs) to 56px (sm+)
- **Container**: `maxWidth="xl"` with responsive padding

### Typography

- **Title**:
  - Font size: 1rem (xs) to 1.25rem (sm+)
  - Font weight: 600
  - Variant: h6
  - Component: h1 (for semantic HTML)

- **Links**:
  - Font size: 0.875rem (xs) to 0.9375rem (sm+)
  - Font weight: medium

### Spacing

- **Container padding**: 2 (xs) to 3 (sm+)
- **Link gap**: 1 (xs) to 2 (sm+)
- **Link padding**: px: 1-1.5 (xs-sm), py: 0.75

### Colors

#### Surface Variant (Default)
- Background: `theme.palette.background.paper`
- Border: `1px solid theme.palette.divider`
- Text: `theme.palette.text.primary`
- Active link: `theme.palette.primary.main`
- Active background: `theme.palette.action.selected`
- Hover background: `theme.palette.action.hover`

#### Primary Variant
- Background: `theme.palette.primary.main`
- Text: `theme.palette.common.white`
- Active link: `theme.palette.primary.main` (on white bg)
- Hover background: `rgba(255, 255, 255, 0.1)`

#### Transparent Variant
- Background: `transparent`
- Text: `theme.palette.text.primary`
- Active link: `theme.palette.primary.main`

#### Dark Variant
- Background: `theme.palette.grey[800/900]` (based on theme mode)
- Text: `theme.palette.common.white`
- Hover background: `rgba(255, 255, 255, 0.1)`

### Transitions

All interactive elements use smooth transitions:
- Duration: `theme.transitions.duration.short`
- Properties: `background-color`, `color`

## Accessibility

- **Semantic HTML**: Uses proper `<nav>` element for navigation
- **Heading Hierarchy**: Title uses `<h1>` component (styled as h6)
- **Keyboard Navigation**: Full keyboard support with Tab navigation
- **Focus Indicators**: Clear 2px outline on focus-visible states
- **Link Labels**: Descriptive text for all links
- **Color Contrast**: Meets WCAG 2.1 AA standards

## Responsive Behavior

### Mobile (< 600px)
- Title: 1rem font size
- Links: 0.875rem font size
- Gap: 1 (8px)
- Link padding: px: 1, py: 0.75
- Container padding: 2 (16px)

### Tablet/Desktop (>= 600px)
- Title: 1.25rem font size
- Links: 0.9375rem font size
- Gap: 2 (16px)
- Link padding: px: 1.5, py: 0.75
- Container padding: 3 (24px)

## Performance Considerations

- **Memoized Styles**: Variant styles are memoized using `useMemo` to prevent unnecessary recalculations
- **Optimized Re-renders**: Component only re-renders when props change
- **CSS Transitions**: Hardware-accelerated transitions for smooth animations
- **Minimal DOM**: Clean, minimal DOM structure for fast rendering

## Integration with Existing Components

The SecondaryNav component follows the exact patterns established in the codebase:

- Uses `'use client'` directive for client-side rendering
- Imports components from the project's component library
- Follows the theme structure from `@/app/theme/createTheme`
- Uses the same Container, Box, Typography, and Link patterns as other pages
- Consistent with AppBar positioning and styling

## Example: Complete Page Layout

```tsx
'use client';

import { usePathname } from 'next/navigation';
import { AppBarWithAuth } from '@/app/components/AppBarWithAuth/AppBarWithAuth';
import { SecondaryNav } from '@/app/components/SecondaryNav';
import { Container } from '@mui/material';
import { Box } from '@/app/components/Box/Box';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();

  const navLinks = [
    { label: 'Overview', href: '/dashboard', active: pathname === '/dashboard' },
    { label: 'Analytics', href: '/dashboard/analytics', active: pathname.startsWith('/dashboard/analytics') },
    { label: 'Reports', href: '/dashboard/reports', active: pathname.startsWith('/dashboard/reports') },
    { label: 'Settings', href: '/dashboard/settings', active: pathname.startsWith('/dashboard/settings') },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Main AppBar */}
      <AppBarWithAuth
        variant="surface"
        position="sticky"
        wordmark="My App"
      />

      {/* Secondary Navigation */}
      <SecondaryNav
        title="Dashboard"
        links={navLinks}
        variant="surface"
      />

      {/* Main Content */}
      <Box component="main" sx={{ flex: 1, pt: 3 }}>
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
}
```

## File Structure

```
src/app/components/SecondaryNav/
├── SecondaryNav.tsx    # Main component implementation
├── types.ts            # TypeScript interfaces
├── index.ts            # Barrel exports
└── README.md           # This file
```

## Browser Support

The component supports all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

When making changes to this component:

1. Maintain TypeScript strict mode compliance
2. Update JSDoc comments for any prop changes
3. Ensure all variants are tested
4. Verify responsive behavior at all breakpoints
5. Test keyboard navigation and focus states
6. Update this README if adding new features

## Related Components

- `AppBarWithAuth`: Main navigation bar
- `AppBar`: Base navigation component
- `Link`: Next.js Link wrapper with MUI styling
- `Typography`: Typography component
- `Container`: MUI Container with consistent maxWidth

## License

Part of the Science Portal Next.js application.
