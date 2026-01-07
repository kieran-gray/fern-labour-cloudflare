import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FloatingPanel } from '@base/components/Controls/FloatingPanel';
import { useLabourSession } from '@base/contexts/LabourSessionContext';
import { useLabourClient } from '@base/hooks';
import { flattenContractions, useContractionsInfinite } from '@base/hooks/useInfiniteQueries';
import { useCurrentLabour } from '@base/hooks/useLabourData';
import {
  getFloatingControlsPadding,
  scrollMainToBottom,
  useSwipeableNavigation,
} from '@base/hooks/useSwipeableNavigation';
import { NotFoundError, PermissionDenied } from '@base/lib/errors';
import { useNetworkState } from '@base/offline/sync/networkDetector';
import { AppShell } from '@components/AppShell';
import { PageSkeleton } from '@components/Cards/CardSkeleton';
import { ErrorContainer } from '@components/ErrorContainer/ErrorContainer';
import { TabTransition } from '@components/TabTransition/TabTransition';
import {
  IconChartHistogram,
  IconMessage,
  IconSend,
  IconSettings,
  IconStopwatch,
} from '@tabler/icons-react';
import { useSearchParams } from 'react-router-dom';
import { Space } from '@mantine/core';
import { CompletedLabourCard } from '../CompletedLabour/Page';
import { LabourDetails } from './Tabs/ManageLabour/Manage';
import Plan from './Tabs/ManageLabour/Plan';
import { SubscribersContainer } from './Tabs/ManageLabour/SubscribersContainer';
import { InviteByEmail } from './Tabs/Share/InviteByEmail';
import { ShareLabour } from './Tabs/Share/ShareLabour';
import { LabourStatistics } from './Tabs/Statistics/LabourStatistics';
import { ContractionControls } from './Tabs/Track/ContractionControls';
import { Contractions } from './Tabs/Track/Contractions';
import { LabourUpdateControls } from './Tabs/Updates/LabourUpdateControls';
import { LabourUpdates } from './Tabs/Updates/LabourUpdates';
import baseClasses from '@styles/base.module.css';

const TABS = [
  { id: 'details', label: 'Manage', icon: IconSettings },
  { id: 'updates', label: 'Updates', icon: IconMessage, scrollToTop: false },
  { id: 'track', label: 'Track', icon: IconStopwatch, scrollToTop: false },
  { id: 'stats', label: 'Stats', icon: IconChartHistogram },
  { id: 'share', label: 'Share', icon: IconSend },
] as const;

const tabOrder = TABS.map((tab) => tab.id);

export const MotherView = () => {
  const { isOnline } = useNetworkState();
  const { labourId, setLabourId } = useLabourSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const labourIdParam = searchParams.get('labourId');
  const tabParam = searchParams.get('tab');

  const activeTab = useMemo((): string => {
    if (tabParam && TABS.some((tab) => tab.id === tabParam)) {
      return tabParam;
    }
    return 'details';
  }, [tabParam]);

  const prevTabRef = useRef(activeTab);
  const directionRef = useRef<'left' | 'right' | null>(null);
  const [isUpdateControlsExpanded, setIsUpdateControlsExpanded] = useState(true);
  const [isContractionControlsExpanded, setIsContractionControlsExpanded] = useState(true);

  if (prevTabRef.current !== activeTab) {
    const currentIndex = tabOrder.indexOf(prevTabRef.current as (typeof tabOrder)[number]);
    const newIndex = tabOrder.indexOf(activeTab as (typeof tabOrder)[number]);
    if (newIndex !== -1 && currentIndex !== -1) {
      directionRef.current = newIndex > currentIndex ? 'right' : 'left';
    }
    prevTabRef.current = activeTab;
  }

  useEffect(() => {
    const tab = TABS.find((t) => t.id === activeTab);
    if ((tab as any)?.scrollToTop !== false) {
      const main = document.getElementById('app-main');
      if (main) {
        main.scrollTo({ top: 0, behavior: 'instant' });
      }
    }
  }, [activeTab]);

  const handleTabChange = useCallback(
    (newTab: string) => {
      setSearchParams((prev) => {
        prev.set('tab', newTab);
        return prev;
      });
    },
    [setSearchParams]
  );

  const swipeHandlers = useSwipeableNavigation({
    activeTab,
    tabOrder,
    setActiveTab: handleTabChange,
  });

  const currentLabourId = labourId || labourIdParam;

  const client = useLabourClient();
  const { isPending, isError, data: labour, error } = useCurrentLabour(client, currentLabourId);
  const { data: contractionsData } = useContractionsInfinite(client, currentLabourId);
  const contractions = useMemo(() => flattenContractions(contractionsData), [contractionsData]);

  useEffect(() => {
    if (labour && !currentLabourId && labour.labour_id !== labourId && labour.end_time === null) {
      setLabourId(labour.labour_id);
    }
  }, [labour, currentLabourId, labourId, setLabourId]);

  useEffect(() => {
    if (isError && error instanceof PermissionDenied) {
      searchParams.delete('labourId');
      setSearchParams(searchParams);
    }
  }, [isError, error, searchParams, setSearchParams]);

  const completed = labour?.end_time !== null;
  const activeContraction = contractions.find(
    (contraction) => contraction.duration.start_time === contraction.duration.end_time
  );

  const renderTabPanel = useCallback(
    (tabId: string) => {
      if (!labour) {
        return null;
      }
      switch (tabId) {
        case 'details':
          return (
            <>
              <LabourDetails activeContraction={activeContraction} labour={labour} />
              <Space h="xl" />
              <SubscribersContainer />
            </>
          );
        case 'track':
          return <Contractions labour={labour} />;
        case 'stats':
          return <LabourStatistics labour={labour} />;
        case 'updates':
          return <LabourUpdates labour={labour} />;
        case 'share':
          return completed ? (
            <CompletedLabourCard />
          ) : (
            <>
              <ShareLabour />
              <Space h="xl" />
              <InviteByEmail />
            </>
          );
        default:
          return null;
      }
    },
    [activeContraction, labour, completed]
  );

  const handleTransitionEnd = useCallback(() => {
    const tab = TABS.find((t) => t.id === activeTab);
    if ((tab as any)?.scrollToTop === false) {
      scrollMainToBottom(true);
    }
  }, [activeTab]);

  if (isPending) {
    return <PageSkeleton />;
  }

  if (isError) {
    if (error instanceof NotFoundError) {
      return (
        <AppShell>
          <div className={baseClasses.flexPageColumn}>
            <Plan />
          </div>
        </AppShell>
      );
    }
    return (
      <AppShell>
        <ErrorContainer message={error?.message || 'An error occurred'} />
      </AppShell>
    );
  }

  if (!labour) {
    return (
      <AppShell>
        <ErrorContainer message="Labour data not found" />
      </AppShell>
    );
  }

  const bottomPadding = getFloatingControlsPadding({
    activeTab,
    completed,
    isContractionControlsExpanded,
    isUpdateControlsExpanded,
    hasActiveContraction: !!activeContraction,
    isOnline,
  });

  return (
    <div {...swipeHandlers}>
      <AppShell navItems={TABS} activeNav={activeTab} onNavChange={handleTabChange}>
        <div className={baseClasses.flexPageColumn} style={{ paddingBottom: bottomPadding }}>
          <TabTransition
            activeTab={activeTab}
            renderTab={renderTabPanel}
            direction={directionRef.current}
            style={{
              width: '100%',
            }}
            onTransitionEnd={handleTransitionEnd}
          />
        </div>

        <>
          <FloatingPanel
            visible={activeTab === 'track' && !completed}
            onToggle={(expanded) => {
              setIsContractionControlsExpanded(expanded);
              if (expanded) {
                setTimeout(() => scrollMainToBottom(true), 50);
              }
            }}
          >
            <ContractionControls
              labourCompleted={completed}
              activeContraction={activeContraction}
            />
          </FloatingPanel>

          <FloatingPanel
            visible={activeTab === 'updates' && !completed}
            onToggle={(expanded) => {
              setIsUpdateControlsExpanded(expanded);
              if (expanded) {
                setTimeout(() => scrollMainToBottom(true), 50);
              }
            }}
          >
            <LabourUpdateControls />
          </FloatingPanel>
        </>
      </AppShell>
    </div>
  );
};
