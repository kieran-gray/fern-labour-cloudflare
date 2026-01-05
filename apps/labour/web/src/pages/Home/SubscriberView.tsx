import { useCallback, useEffect, useMemo, useState } from 'react';
import { SubscriberRole } from '@base/clients/labour_service';
import { FloatingPanel } from '@base/components/Controls/FloatingPanel';
import { SubscriberSessionState, useLabourSession } from '@base/contexts/LabourSessionContext';
import { useLabourClient } from '@base/hooks';
import { flattenContractions, useContractionsInfinite } from '@base/hooks/useInfiniteQueries';
import { useLabourById, useUserSubscription } from '@base/hooks/useLabourData';
import {
  getFloatingControlsPadding,
  scrollMainToBottom,
  useSwipeableNavigation,
} from '@base/hooks/useSwipeableNavigation';
import { useNetworkState } from '@base/offline/sync/networkDetector';
import { AppShell } from '@components/AppShell';
import { ErrorContainer } from '@components/ErrorContainer/ErrorContainer';
import { PageLoading } from '@components/PageLoading/PageLoading';
import { TabTransition } from '@components/TabTransition/TabTransition';
import { pluraliseName } from '@lib';
import {
  IconChartHistogram,
  IconMessage,
  IconPencil,
  IconShoppingBag,
  IconStopwatch,
  IconUsers,
} from '@tabler/icons-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Space } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { PayWall } from './components/Paywall/PayWall';
import Gifts from './Tabs/Gifts/Gifts';
import { ManageSubscriptions } from './Tabs/MySubscriptions/MySubscriptions';
import { ShareFernLabour } from './Tabs/MySubscriptions/ShareFernLabour';
import SubscriptionRequestedModal from './Tabs/MySubscriptions/SubscriptionRequestedModal';
import { LabourStatistics } from './Tabs/Statistics/LabourStatistics';
import ContactMethods from './Tabs/SubscriptionDetails/ContactMethods';
import { SubscriberLabourDetails } from './Tabs/SubscriptionDetails/LabourDetails';
import { ContractionControls } from './Tabs/Track/ContractionControls';
import { Contractions } from './Tabs/Track/Contractions';
import { LabourUpdateControls } from './Tabs/Updates/LabourUpdateControls';
import { LabourUpdates } from './Tabs/Updates/LabourUpdates';
import baseClasses from '@styles/base.module.css';

const FULL_ACCESS_TABS = [
  { id: 'subscriptions', label: 'Subscriptions', icon: IconUsers },
  { id: 'details', label: 'Details', icon: IconPencil },
  { id: 'updates', label: 'Updates', icon: IconMessage, scrollToTop: false },
  { id: 'track', label: 'Track', icon: IconStopwatch, scrollToTop: false },
  { id: 'stats', label: 'Stats', icon: IconChartHistogram },
] as const;

const SUPPORT_PERSON_TABS = [
  { id: 'subscriptions', label: 'Subscriptions', icon: IconUsers },
  { id: 'details', label: 'Details', icon: IconPencil },
  { id: 'updates', label: 'Updates', icon: IconMessage, scrollToTop: false },
  { id: 'stats', label: 'Stats', icon: IconChartHistogram },
  { id: 'gifts', label: 'Gifts', icon: IconShoppingBag },
] as const;

const LOVED_ONE_TABS = [
  { id: 'subscriptions', label: 'Subscriptions', icon: IconUsers },
  { id: 'details', label: 'Details', icon: IconPencil },
  { id: 'updates', label: 'Updates', icon: IconMessage, scrollToTop: false },
  { id: 'gifts', label: 'Gifts', icon: IconShoppingBag },
] as const;

const LIMITED_TABS = [{ id: 'subscriptions', label: 'Subscriptions', icon: IconUsers }] as const;

export const SubscriberView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { labourId, subscriberState, subscriberRole, clearSession, updateSubscription } =
    useLabourSession();
  const { isOnline } = useNetworkState();
  const promptParam = searchParams.get('prompt');
  const [modalOpened, { close: closeModal }] = useDisclosure(promptParam === 'requested');

  const TABS = useMemo(() => {
    if (subscriberState !== SubscriberSessionState.Active) {
      return LIMITED_TABS;
    }
    switch (subscriberRole) {
      case SubscriberRole.BIRTH_PARTNER:
        return FULL_ACCESS_TABS;
      case SubscriberRole.SUPPORT_PERSON:
        return SUPPORT_PERSON_TABS;
      case SubscriberRole.LOVED_ONE:
      default:
        return LOVED_ONE_TABS;
    }
  }, [subscriberState, subscriberRole]);

  const tabOrder = TABS.map((tab) => tab.id);

  const [activeTab, setActiveTab] = useState<string | null>('subscriptions');
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [isUpdateControlsExpanded, setIsUpdateControlsExpanded] = useState(true);
  const [isContractionControlsExpanded, setIsContractionControlsExpanded] = useState(true);

  // Scroll to top on tab change, unless it's a tab that auto-scrolls to bottom
  useEffect(() => {
    const tab = TABS.find((t) => t.id === activeTab);
    if ((tab as any)?.scrollToTop !== false) {
      const main = document.getElementById('app-main');
      if (main) {
        main.scrollTo({ top: 0, behavior: 'instant' });
      }
    }
  }, [activeTab, TABS]);

  const handleTabChange = useCallback(
    (newTab: string) => {
      const currentIndex = tabOrder.indexOf(activeTab as any);
      const newIndex = tabOrder.indexOf(newTab as any);

      if (newIndex !== -1 && currentIndex !== -1) {
        setDirection(newIndex > currentIndex ? 'right' : 'left');
      }
      setActiveTab(newTab);
    },
    [activeTab, tabOrder]
  );

  useEffect(() => {
    const isTabAllowed = TABS.some((tab) => tab.id === activeTab);
    if (!isTabAllowed) {
      setActiveTab('subscriptions');
    }
  }, [activeTab, TABS]);

  const swipeHandlers = useSwipeableNavigation({
    activeTab,
    tabOrder: tabOrder as any,
    setActiveTab: handleTabChange,
  });

  const client = useLabourClient();

  const shouldFetchLabour = subscriberState === SubscriberSessionState.Active && labourId !== null;
  const isBirthPartner = subscriberRole === SubscriberRole.BIRTH_PARTNER;
  const shouldFetchContractions = isBirthPartner && labourId !== null;

  const {
    isPending: isSubPending,
    isError: isSubError,
    data: subscriptionData,
    error: subError,
  } = useUserSubscription(client, shouldFetchLabour ? labourId : null);
  const {
    isPending: isLabourPending,
    isError: isLabourError,
    data: labour,
    error: labourError,
  } = useLabourById(client, shouldFetchLabour ? labourId : null);

  const { data: contractionsData } = useContractionsInfinite(
    client,
    shouldFetchContractions ? labourId : null
  );
  const contractions = useMemo(() => flattenContractions(contractionsData), [contractionsData]);

  const activeContraction = contractions.find(
    (contraction) => contraction.duration.start_time === contraction.duration.end_time
  );

  useEffect(() => {
    if (subscriptionData && shouldFetchLabour) {
      updateSubscription(subscriptionData);
    }
  }, [subscriptionData, shouldFetchLabour, updateSubscription]);

  const completed = labour?.end_time !== null;

  const bottomPadding = getFloatingControlsPadding({
    activeTab,
    completed: completed || false,
    isContractionControlsExpanded,
    isUpdateControlsExpanded,
    hasActiveContraction: !!activeContraction,
    isOnline,
    disabled: !isBirthPartner,
  });

  const isPending = shouldFetchLabour && (isSubPending || isLabourPending);
  const isError = isSubError || isLabourError;
  const error = subError || labourError;

  useEffect(() => {
    if (isError && error?.message.includes('Authorization')) {
      clearSession();
      navigate('/');
    }
  }, [isError, error, clearSession, navigate]);

  if (isPending) {
    return (
      <AppShell>
        <PageLoading />
      </AppShell>
    );
  }

  if (isError && subscriberState === SubscriberSessionState.Active) {
    return (
      <AppShell>
        <ErrorContainer message={error?.message || 'An error occurred'} />
      </AppShell>
    );
  }

  const motherFirstName = labour?.mother_name?.split(' ')[0];
  const pluralisedMotherName = pluraliseName(motherFirstName || '');

  const renderTabPanel = useCallback(
    (tabId: string) => {
      switch (tabId) {
        case 'subscriptions':
          return (
            <>
              <ManageSubscriptions />
              <Space h="xl" />
              <ShareFernLabour />
            </>
          );
        case 'details':
          if (!labour) {
            return <ErrorContainer message="Select a subscription to view details" />;
          }
          return (
            <>
              <SubscriberLabourDetails labour={labour} motherName={pluralisedMotherName} />
              {labour.end_time == null && subscriptionData && (
                <>
                  <Space h="xl" />
                  {subscriptionData.access_level === 'BASIC' ? (
                    <PayWall />
                  ) : (
                    <ContactMethods subscription={subscriptionData} />
                  )}
                </>
              )}
            </>
          );
        case 'track':
          if (!labour) {
            return <ErrorContainer message="Select a subscription to track contractions" />;
          }
          return (
            <Contractions
              labour={labour}
              isSubscriberView
              subscriberRole={subscriberRole || undefined}
            />
          );
        case 'stats':
          if (!labour) {
            return <ErrorContainer message="Select a subscription to view statistics" />;
          }
          return <LabourStatistics labour={labour} isSubscriberView />;
        case 'updates':
          if (!labour) {
            return <ErrorContainer message="Select a subscription to view updates" />;
          }
          return (
            <LabourUpdates
              labour={labour}
              isSubscriberView
              subscriberRole={subscriberRole || undefined}
            />
          );
        case 'gifts':
          return <Gifts birthingPersonName={motherFirstName || ''} />;
        default:
          return null;
      }
    },
    [labour, pluralisedMotherName, subscriptionData, subscriberRole, motherFirstName]
  );

  const handleTransitionEnd = useCallback(() => {
    const tab = TABS.find((t) => t.id === activeTab);
    if ((tab as any)?.scrollToTop === false) {
      scrollMainToBottom(true);
    }
  }, [activeTab, TABS]);

  return (
    <>
      <div {...swipeHandlers}>
        <AppShell navItems={TABS} activeNav={activeTab} onNavChange={handleTabChange}>
          <div className={baseClasses.flexPageColumn} style={{ paddingBottom: bottomPadding }}>
            <TabTransition
              activeTab={activeTab || 'subscriptions'}
              renderTab={renderTabPanel}
              direction={direction}
              style={{
                width: '100%',
              }}
              onTransitionEnd={handleTransitionEnd}
            />
          </div>

          {isBirthPartner && labour && (
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
                  labourCompleted={completed || false}
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
          )}
        </AppShell>
      </div>
      <SubscriptionRequestedModal opened={modalOpened} close={closeModal} />
    </>
  );
};
