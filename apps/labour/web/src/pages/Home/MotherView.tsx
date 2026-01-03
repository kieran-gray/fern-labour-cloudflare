import { useEffect, useMemo, useState } from 'react';
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
import { ErrorContainer } from '@components/ErrorContainer/ErrorContainer';
import { PageLoading } from '@components/PageLoading/PageLoading';
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
  { id: 'updates', label: 'Updates', icon: IconMessage, requiresPaid: true },
  { id: 'track', label: 'Track', icon: IconStopwatch },
  { id: 'stats', label: 'Stats', icon: IconChartHistogram },
  { id: 'share', label: 'Share', icon: IconSend, requiresPaid: true },
] as const;

const tabOrder = TABS.map((tab) => tab.id);

export const MotherView = () => {
  const { isOnline } = useNetworkState();
  const { labourId, setLabourId } = useLabourSession();
  const [searchParams, setSearchParams] = useSearchParams();
  const labourIdParam = searchParams.get('labourId');

  const [activeTab, setActiveTab] = useState<string | null>('track');
  const [isUpdateControlsExpanded, setIsUpdateControlsExpanded] = useState(true);
  const [isContractionControlsExpanded, setIsContractionControlsExpanded] = useState(true);

  const swipeHandlers = useSwipeableNavigation({
    activeTab,
    tabOrder,
    setActiveTab,
  });

  const currentLabourId = labourId || labourIdParam;

  const client = useLabourClient();
  const { isPending, isError, data: labour, error } = useCurrentLabour(client, currentLabourId);
  const { data: contractionsData } = useContractionsInfinite(client, currentLabourId);
  const contractions = useMemo(() => flattenContractions(contractionsData), [contractionsData]);

  // Set labour ID if we got it from active labour
  useEffect(() => {
    if (labour && !currentLabourId && labour.labour_id !== labourId) {
      setLabourId(labour.labour_id);
    }
  }, [labour, currentLabourId, labourId, setLabourId]);

  // Handle permission errors by cleaning up URL params
  useEffect(() => {
    if (isError && error instanceof PermissionDenied) {
      searchParams.delete('labourId');
      setSearchParams(searchParams);
    }
  }, [isError, error, searchParams, setSearchParams]);

  if (isPending) {
    return (
      <AppShell>
        <PageLoading />
      </AppShell>
    );
  }

  if (isError) {
    if (error instanceof NotFoundError) {
      return (
        <AppShell>
          <div className={baseClasses.flexPageColumn}>
            <div className={baseClasses.root} style={{ width: '100%' }}>
              <div className={baseClasses.body}>
                <div className={baseClasses.inner}>
                  <div className={baseClasses.flexColumn} style={{ flexGrow: 1, width: '100%' }}>
                    <Plan labour={undefined} />
                  </div>
                </div>
              </div>
            </div>
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

  const completed = labour.end_time !== null;
  const activeContraction = contractions.find(
    (contraction) => contraction.duration.start_time === contraction.duration.end_time
  );

  const bottomPadding = getFloatingControlsPadding({
    activeTab,
    completed,
    isContractionControlsExpanded,
    isUpdateControlsExpanded,
    hasActiveContraction: !!activeContraction,
    isOnline,
  });

  const renderTabPanel = (tabId: string) => {
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
        return <LabourStatistics labour={labour} contractions={contractions} />;
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
  };

  return (
    <div {...swipeHandlers}>
      <AppShell navItems={TABS} activeNav={activeTab} onNavChange={setActiveTab}>
        <div className={baseClasses.flexPageColumn} style={{ paddingBottom: bottomPadding }}>
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {renderTabPanel(activeTab || 'track')}
          </div>
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
