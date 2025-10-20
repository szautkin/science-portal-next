import React from 'react';
import StorageIcon from '@mui/icons-material/Storage';
import GroupIcon from '@mui/icons-material/Group';
import PublishIcon from '@mui/icons-material/Publish';
import ScienceIcon from '@mui/icons-material/Science';
import SearchIcon from '@mui/icons-material/Search';
import CloudIcon from '@mui/icons-material/Cloud';
import HelpIcon from '@mui/icons-material/Help';
import ChatIcon from '@mui/icons-material/Chat';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import DocumentationIcon from '@mui/icons-material/Description';
import InfoIcon from '@mui/icons-material/Info';
import DiamondIcon from '@mui/icons-material/Diamond';
// Navigation items structure
export interface NavigationItem {
  label: string;
  icon?: React.ReactElement;
  href?: string;
  menuItems?: NavigationItem[];
  divider?: boolean;
  type: 'link' | 'menu';
}

// Main navigation array
export const navigationItems: NavigationItem[] = [
  {
    label: 'Documentation',
    icon: <DocumentationIcon />,
    href: '#',
    type: 'link',
  },
  {
    label: 'Services',
    type: 'menu',
    menuItems: [
      {
        label: 'Storage Management',
        icon: <StorageIcon />,
        href: '/storage',
        type: 'link',
      },
      {
        label: 'Group Management',
        icon: <GroupIcon />,
        href: '/groups',
        type: 'link',
      },
      {
        label: 'Data Publication',
        icon: <PublishIcon />,
        href: '#',
        type: 'link',
      },
      {
        label: 'Science Portal',
        icon: <ScienceIcon />,
        href: '/science-portal',
        type: 'link',
      },
      { label: 'CADC Search', icon: <SearchIcon />, href: '#', type: 'link' },
      {
        label: 'OpenStack Cloud',
        icon: <CloudIcon />,
        href: '#',
        type: 'link',
      },
    ],
  },
  {
    label: 'About',
    icon: <InfoIcon />,
    href: '#',
    type: 'link',
  },
  {
    label: 'Open Source',
    icon: <DiamondIcon />,
    href: '#',
    type: 'link',
  },
  {
    label: 'Support',
    type: 'menu',
    menuItems: [
      { label: 'Help', icon: <HelpIcon />, href: '#', type: 'link' },
      {
        label: 'Join us on Slack',
        icon: <ChatIcon />,
        href: '#',
        type: 'link',
      },
    ],
  },
];

// User account menu items
export const userMenuItems: NavigationItem[] = [
  {
    label: 'Update Profile',
    icon: <AccountCircleIcon />,
    href: '#',
    type: 'link',
  },
  { label: 'Reset Password', icon: <SettingsIcon />, href: '#', type: 'link' },
  {
    label: 'Obtain Certificate',
    icon: <PublishIcon />,
    href: '#',
    type: 'link',
  },
  {
    label: 'Logout',
    icon: <LogoutIcon />,
    href: '#',
    type: 'link',
    divider: true,
  },
];

// Helper functions to extract specific menu items for backward compatibility
export const getServicesMenuItems = () =>
  navigationItems.find((item) => item.label === 'Services')?.menuItems || [];

export const getSupportMenuItems = () =>
  navigationItems.find((item) => item.label === 'Support')?.menuItems || [];

// CANFAR logo component
export const CanfarLogo = ({ height = 40 }: { height?: number }) => (
  /* eslint-disable-next-line @next/next/no-img-element */
  <img src="/logo.png" alt="CANFAR Logo" style={{ height }} />
);

// SRCNet logo component (for OIDC mode)
export const SRCNetLogo = ({ height = 40 }: { height?: number }) => (
  /* eslint-disable-next-line @next/next/no-img-element */
  <img src="/SRCNetLogo.png" alt="SRCNet Logo" style={{ height }} />
);

// Convert navigation items to AppBar format
export const getAppBarLinks = () =>
  navigationItems.map((item) => ({
    label: item.label,
    href: item.type === 'link' ? item.href : undefined,
    menuItems:
      item.type === 'menu'
        ? item.menuItems?.map((subItem) => ({
            label: subItem.label,
            icon: subItem.icon,
            href: subItem.href,
          }))
        : undefined,
  }));

// Complete navigation structure for AppBar
export const defaultAppBarNavigation = {
  logo: <CanfarLogo />,
  links: getAppBarLinks(),
};

// Navigation structure with user menu for AppBar
export const appBarWithUserMenu = {
  ...defaultAppBarNavigation,
  menuLabel: 'janedoe',
  menuItems: userMenuItems.map((item) => ({
    label: item.label,
    icon: item.icon,
    href: item.href,
    divider: item.divider,
  })),
};
