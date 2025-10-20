'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { AppBar } from '@/app/components/AppBar/AppBar';
import { AppBarProps } from '@/app/types/AppBarProps';
import { LoginModal } from '@/app/components/LoginModal/LoginModal';
import {
  useAuthStatus,
  useLogin,
  useLogout,
  useOIDCLogin,
  useAuthModeSync,
} from '@/lib/hooks/useAuth';
import type { LoginCredentials } from '@/lib/api/login';
import {
  PersonOutline,
  VpnKey,
  Verified,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { CircularProgress } from '@mui/material';

const RESET_PASSWORD_URL =
  'https://www.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/en/auth/resetPassword.html';
const UPDATE_PROFILE_URL =
  'https://www.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/en/auth/profile.html';
const OBTAIN_CERTIFICATE_URL =
  'https://www.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/en/auth/certificate.html';

interface AppBarWithAuthProps extends Omit<AppBarProps, 'menuLabel' | 'menuItems'> {
  /**
   * Show login button instead of user menu when not authenticated
   */
  showLoginButton?: boolean;
}

export function AppBarWithAuth({
  showLoginButton = true,
  logo,
  logoHref,
  onLogoClick,
  wordmark,
  links,
  accountButton,
  position,
  elevation,
  variant,
  sx,
  ...otherProps
}: AppBarWithAuthProps) {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const { data: authStatus, isLoading: isCheckingAuth } = useAuthStatus();
  const { mutate: login, isPending: isLoggingIn, error: loginError } = useLogin();
  const { mutate: logout } = useLogout();
  const { login: oidcLogin, isOIDCMode } = useOIDCLogin();

  // Sync auth mode from environment
  useAuthModeSync();

  // Check for showLogin URL parameter on mount (after logout redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('showLogin') === 'true') {
      // Open login modal
      setLoginModalOpen(true);
      // Clean up URL by removing the showLogin parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('showLogin');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, []);

  const handleOpenLogin = useCallback(() => {
    setLoginModalOpen(true);
  }, []);

  const handleCloseLogin = useCallback(() => {
    setLoginModalOpen(false);
  }, []);

  const handleLogin = useCallback(
    (credentials: LoginCredentials) => {
      login(
        {
          username: credentials.username,
          password: credentials.password,
        },
        {
          onSuccess: () => {
            handleCloseLogin();
          },
        }
      );
    },
    [login, handleCloseLogin]
  );

  const handleLogout = useCallback(() => {
    logout(undefined, {
      onSuccess: () => {
        // Clear URL query parameters and add showLogin flag
        const currentUrl = new URL(window.location.href);
        currentUrl.search = '?showLogin=true';
        // Reload the page to reset all state and show login modal
        window.location.href = currentUrl.toString();
      },
    });
  }, [logout]);

  const handleUpdateProfile = useCallback(() => {
    window.open(UPDATE_PROFILE_URL, '_blank', 'noopener,noreferrer');
  }, []);

  const handleResetPassword = useCallback(() => {
    window.open(RESET_PASSWORD_URL, '_blank', 'noopener,noreferrer');
  }, []);

  const handleObtainCertificate = useCallback(() => {
    window.open(OBTAIN_CERTIFICATE_URL, '_blank', 'noopener,noreferrer');
  }, []);

  const isAuthenticated = authStatus?.authenticated ?? false;

  // Get user's first and last name, fallback to username or 'User'
  const firstName = authStatus?.user?.firstName ?? '';
  const lastName = authStatus?.user?.lastName ?? '';
  const username = authStatus?.user?.username ?? '';

  // Build display name: "FirstName LastName" or username as fallback
  const displayName = firstName && lastName
    ? `${firstName} ${lastName}`.trim()
    : username || 'User';

  // Don't show menu items while checking auth status to prevent flickering
  // Only show menu when we have auth status data
  const showAuthenticatedMenu = !isCheckingAuth && authStatus !== undefined && isAuthenticated;
  const showUnauthenticatedMenu = !isCheckingAuth && authStatus !== undefined && !isAuthenticated;

  // Debug logging
  console.log('AppBarWithAuth state:', {
    isCheckingAuth,
    isAuthenticated,
    firstName,
    lastName,
    username,
    displayName,
    showAuthenticatedMenu,
    showUnauthenticatedMenu,
    authStatus,
  });

  // Menu items shown when authenticated
  // CANFAR-specific items only show in CANFAR mode
  const authenticatedMenuItems = [
    ...(!isOIDCMode
      ? [
          {
            label: 'Update Profile',
            onClick: handleUpdateProfile,
            icon: <PersonOutline fontSize="small" />,
          },
          {
            label: 'Reset Password',
            onClick: handleResetPassword,
            icon: <VpnKey fontSize="small" />,
          },
          {
            label: 'Obtain Certificate',
            onClick: handleObtainCertificate,
            icon: <Verified fontSize="small" />,
          },
        ]
      : []),
    {
      label: 'Logout',
      onClick: handleLogout,
      icon: <LogoutIcon fontSize="small" />,
      divider: !isOIDCMode, // Only show divider if CANFAR items are present
    },
  ];

  // Always show at least one dummy menu item to keep button visible
  // Empty label will trigger custom click handler in appBar
  const dummyMenuItem = [
    {
      label: '',
      onClick: () => {},
    },
  ];

  // Menu items for unauthenticated state - use dummy to keep button visible
  const unauthenticatedMenuItems = dummyMenuItem;

  // Menu items for loading state - use dummy to keep button visible
  const loadingMenuItem = dummyMenuItem;

  // Handle account button click - open login modal or redirect to OIDC provider
  const handleAccountButtonClick = useCallback(() => {
    console.log('handleAccountButtonClick called in AppBarWithAuth');
    if (!isCheckingAuth && !isAuthenticated && showLoginButton) {
      if (isOIDCMode) {
        // For OIDC, redirect to provider
        console.log('Redirecting to OIDC provider');
        oidcLogin();
      } else {
        // For CANFAR, open login modal
        console.log('Opening login modal');
        handleOpenLogin();
      }
    }
  }, [isCheckingAuth, isAuthenticated, showLoginButton, isOIDCMode, oidcLogin, handleOpenLogin]);

  // Determine menu items to pass
  const menuItemsToPass = isCheckingAuth
    ? loadingMenuItem
    : showAuthenticatedMenu
    ? authenticatedMenuItems
    : unauthenticatedMenuItems;

  // Determine menu label
  const menuLabelToShow = isCheckingAuth ? (
    <CircularProgress size={20} color="inherit" />
  ) : showAuthenticatedMenu ? (
    displayName
  ) : (
    'Login'
  );

  console.log('AppBarWithAuth rendering:', {
    menuItemsLength: menuItemsToPass.length,
    menuLabel: typeof menuLabelToShow === 'string' ? menuLabelToShow : 'CircularProgress',
    isCheckingAuth,
    showAuthenticatedMenu,
  });

  return (
    <>
      <AppBar
        logo={logo}
        logoHref={logoHref}
        onLogoClick={onLogoClick}
        wordmark={wordmark}
        links={links}
        menuLabel={menuLabelToShow}
        menuItems={menuItemsToPass}
        onAccountButtonClick={handleAccountButtonClick}
        accountButton={accountButton}
        position={position}
        elevation={elevation}
        variant={variant}
        sx={sx}
      />
      {/* Only show login modal in CANFAR mode */}
      {!isOIDCMode && (
        <LoginModal
          open={loginModalOpen}
          onClose={handleCloseLogin}
          onSubmit={handleLogin}
          isLoading={isLoggingIn}
          errorMessage={loginError?.message}
        />
      )}
    </>
  );
}
