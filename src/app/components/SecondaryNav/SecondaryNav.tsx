'use client';

import React, { useMemo } from 'react';
import {
  AppBar,
  Toolbar,
  Container,
  useTheme,
} from '@mui/material';
import type { Theme } from '@mui/material/styles';
import '@/app/theme/createTheme';
import { Box } from '@/app/components/Box/Box';
import { Typography } from '@/app/components/Typography/Typography';
import { Link } from '@/app/components/Link/Link';
import type { SecondaryNavProps } from './types';

/**
 * SecondaryNav Component
 *
 * A sticky secondary navigation bar that sits below the main AppBar.
 * Displays a page title on the left and navigation links on the right.
 *
 * Features:
 * - Sticky positioning below main nav (top: 64px)
 * - Responsive design with MUI breakpoints
 * - Multiple visual variants (surface, primary, transparent, dark)
 * - Active link highlighting
 * - Smooth hover transitions
 * - Full accessibility support
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
export function SecondaryNav({
  title,
  links,
  variant = 'surface',
  sx,
}: SecondaryNavProps) {
  const theme = useTheme() as Theme;

  // Theme-aware variant styles - memoized to prevent recalculation on every render
  const variantStyles = useMemo(() => {
    const baseStyles = {
      fontFamily: theme.typography.fontFamily,
      transition: theme.transitions.create(
        ['background-color', 'color', 'box-shadow'],
        {
          duration: theme.transitions.duration.short,
        }
      ),
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyles,
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          boxShadow: theme.shadows[1],
          borderBottom: 'none',
        };
      case 'transparent':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: theme.palette.text.primary,
          boxShadow: 'none',
          borderBottom: 'none',
        };
      case 'dark':
        return {
          ...baseStyles,
          backgroundColor:
            theme.palette.mode === 'dark'
              ? theme.palette.grey[800]
              : theme.palette.grey[900],
          color: theme.palette.common.white,
          boxShadow: theme.shadows[1],
          borderBottom: 'none',
        };
      case 'surface':
      default:
        return {
          ...baseStyles,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          boxShadow: 'none',
          borderBottom: `1px solid ${theme.palette.divider}`,
        };
    }
  }, [variant, theme]);

  // Get link color based on variant
  const getLinkColor = (active: boolean = false) => {
    if (active) {
      return theme.palette.primary.main;
    }

    switch (variant) {
      case 'primary':
      case 'dark':
        return theme.palette.common.white;
      default:
        return theme.palette.text.primary;
    }
  };

  // Get link hover background based on variant
  const getLinkHoverBg = () => {
    switch (variant) {
      case 'primary':
      case 'dark':
        return 'rgba(255, 255, 255, 0.1)';
      default:
        return theme.palette.action.hover;
    }
  };

  // Get active link background
  const getActiveLinkBg = () => {
    switch (variant) {
      case 'primary':
      case 'dark':
        return 'rgba(255, 255, 255, 0.15)';
      default:
        return theme.palette.action.selected;
    }
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        ...variantStyles,
        top: '64px', // Position below main AppBar
        zIndex: theme.zIndex.appBar - 1,
        ...sx,
      }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 48, sm: 56 },
          px: 0,
        }}
      >
        <Container
          maxWidth="xl"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: { xs: 2, sm: 3 },
          }}
        >
          {/* Page Title - Left Side */}
          <Typography
            variant="h6"
            component="h1"
            sx={{
              flexGrow: 1,
              fontSize: { xs: '1rem', sm: '1.25rem' },
              fontWeight: 600,
              color: 'inherit',
            }}
          >
            {title}
          </Typography>

          {/* Navigation Links - Right Side */}
          <Box
            component="nav"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1, sm: 2 },
            }}
          >
            {links.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                variant="inherit"
                underline="none"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: { xs: '0.875rem', sm: '0.9375rem' },
                  fontWeight: theme.typography.fontWeightMedium,
                  px: { xs: 1, sm: 1.5 },
                  py: 0.75,
                  borderRadius: theme.customBorderRadius?.md || theme.shape.borderRadius,
                  minHeight: '36px',
                  color: getLinkColor(link.active),
                  backgroundColor: link.active ? getActiveLinkBg() : 'transparent',
                  transition: theme.transitions.create(
                    ['background-color', 'color'],
                    {
                      duration: theme.transitions.duration.short,
                    }
                  ),
                  '&:hover': {
                    backgroundColor: link.active ? getActiveLinkBg() : getLinkHoverBg(),
                    color: link.active
                      ? theme.palette.primary.main
                      : variant === 'primary' || variant === 'dark'
                      ? theme.palette.common.white
                      : theme.palette.primary.main,
                  },
                  '&:focus-visible': {
                    outline: `2px solid ${
                      variant === 'primary' || variant === 'dark'
                        ? theme.palette.common.white
                        : theme.palette.primary.main
                    }`,
                    outlineOffset: theme.spacing(0.25),
                  },
                }}
              >
                {link.label}
              </Link>
            ))}
          </Box>
        </Container>
      </Toolbar>
    </AppBar>
  );
}
