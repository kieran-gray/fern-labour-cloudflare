import { useSwipeable } from 'react-swipeable';

interface UseSwipeableNavigationOptions<T extends string> {
  /** Currently active tab */
  activeTab: T | null;
  /** Ordered list of tab IDs */
  tabOrder: readonly T[];
  /** Callback to change the active tab */
  setActiveTab: (tab: T) => void;
}

/**
 * Hook that provides swipe handlers for tab navigation.
 * Swipe right goes to previous tab, swipe left goes to next tab.
 */
export function useSwipeableNavigation<T extends string>({
  activeTab,
  tabOrder,
  setActiveTab,
}: UseSwipeableNavigationOptions<T>) {
  return useSwipeable({
    onSwipedRight: () => {
      if (activeTab) {
        const tabIndex = tabOrder.indexOf(activeTab);
        if (tabIndex > 0) {
          setActiveTab(tabOrder[tabIndex - 1]);
        }
      }
    },
    onSwipedLeft: () => {
      if (activeTab) {
        const tabIndex = tabOrder.indexOf(activeTab);
        if (tabIndex < tabOrder.length - 1) {
          setActiveTab(tabOrder[tabIndex + 1]);
        }
      }
    },
    delta: 10,
    swipeDuration: 250,
    trackTouch: true,
    preventScrollOnSwipe: true,
  });
}

/**
 * Scrolls the main app container to the bottom.
 * Useful after expanding floating panels.
 */
export function scrollMainToBottom(smooth: boolean = true) {
  const main = document.getElementById('app-main');
  if (main) {
    main.scrollTo({ top: main.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  }
}

interface FloatingControlsPaddingOptions {
  activeTab: string | null;
  completed: boolean;
  isContractionControlsExpanded: boolean;
  isUpdateControlsExpanded: boolean;
  hasActiveContraction: boolean;
  isOnline: boolean;
  /** Additional condition that disables floating controls (e.g., not a birth partner in subscriber view) */
  disabled?: boolean;
}

/**
 * Calculates the bottom padding needed to accommodate floating control panels.
 * Returns appropriate padding based on which panel is visible and its expanded state.
 */
export function getFloatingControlsPadding({
  activeTab,
  completed,
  isContractionControlsExpanded,
  isUpdateControlsExpanded,
  hasActiveContraction,
  isOnline,
  disabled = false,
}: FloatingControlsPaddingOptions): string {
  // No floating controls on desktop (>=768px), when completed, or when disabled
  if (window.innerWidth >= 768 || completed || disabled) {
    return '30px';
  }

  if (activeTab === 'track') {
    if (!isContractionControlsExpanded) {
      return '50px';
    }
    return hasActiveContraction ? '310px' : '140px';
  }

  if (activeTab === 'updates') {
    if (isUpdateControlsExpanded) {
      return isOnline ? '190px' : '120px';
    }
    return '55px';
  }

  return '30px';
}
