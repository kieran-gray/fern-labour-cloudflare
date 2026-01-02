import { ReactNode } from 'react';
import { AppShell, NavItem } from '@components/AppShell';
import baseClasses from '@styles/base.module.css';

interface LabourPageShellProps {
  activeTab: string | null;
  onTabChange: (tab: string) => void;
  tabs: readonly NavItem[] | NavItem[];
  swipeHandlers: any; // Type depends on useSwipeableNavigation return type, using any/object for now or specific if known
  children: ReactNode;
  floatingPanels?: ReactNode;
  bottomPadding?: number | string;
}

export const LabourPageShell = ({
  activeTab,
  onTabChange,
  tabs,
  swipeHandlers,
  children,
  floatingPanels,
  bottomPadding = 0,
}: LabourPageShellProps) => {
  return (
    <div {...swipeHandlers}>
      <AppShell navItems={tabs} activeNav={activeTab} onNavChange={onTabChange}>
        <div className={baseClasses.flexPageColumn} style={{ paddingBottom: bottomPadding }}>
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {children}
          </div>
        </div>

        {floatingPanels}
      </AppShell>
    </div>
  );
};
