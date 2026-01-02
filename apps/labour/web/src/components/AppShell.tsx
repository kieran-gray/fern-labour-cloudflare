import { Icon } from '@tabler/icons-react';
import { Box } from '@mantine/core';
import { BottomNavigation } from './BottomNavigation';
import { PillHeader } from './Header/PillHeader';

export interface NavItem {
  id: string;
  label: string;
  icon: Icon;
  requiresPaid?: boolean;
}

interface AppShellProps {
  children: React.ReactNode;
  navItems?: readonly NavItem[];
  activeNav?: string | null;
  onNavChange?: (nav: string) => void;
}

export const AppShell = ({ children, navItems, activeNav, onNavChange }: AppShellProps) => {
  return (
    <Box
      component="div"
      style={{
        height: '100svh',
        display: 'grid',
        gridTemplateRows: '1fr auto',
        overflow: 'hidden',
        backgroundColor: 'light-dark(#ffeae6, #121212)',
      }}
    >
      {/* Header overlay (floats over content) */}
      <Box
        component="div"
        style={{
          position: 'fixed',
          top: 'env(safe-area-inset-top, 0px)',
          left: 0,
          right: 0,
          zIndex: 200,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div style={{ width: '100%', pointerEvents: 'auto' }}>
          <PillHeader navItems={navItems} activeNav={activeNav} onNavChange={onNavChange} />
        </div>
      </Box>
      <Box
        component="main"
        id="app-main"
        style={{
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + var(--header-overlay-height, 84px))',
        }}
      >
        {children}
      </Box>
      <Box component="footer" style={{ position: 'relative', zIndex: 140 }}>
        {navItems && (
          <BottomNavigation
            items={navItems}
            activeItem={activeNav ?? null}
            onItemChange={(id) => onNavChange?.(id)}
          />
        )}
      </Box>
    </Box>
  );
};
