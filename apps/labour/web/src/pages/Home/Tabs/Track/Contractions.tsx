import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { LabourReadModel, SubscriberRole } from '@base/clients/labour_service/types';
import { useLabourClient } from '@base/hooks';
import { flattenContractions, useContractionsInfinite } from '@base/hooks/useInfiniteQueries';
import { useTransitionStatus } from '@components/TabTransition/TransitionStatusContext';
import { IconBook, IconHistory } from '@tabler/icons-react';
import { ActionIcon, Button, Image, Space, Stack, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { AlertContainer } from './Components/Alerts';
import { TrackingStatusCard } from './Components/Controls/TrackingStatusCard';
import { ContractionMiniChart } from './Components/MiniChart/ContractionMiniChart';
import { ContractionStats } from './Components/Stats/ContractionStats';
import ContractionTimelineCustom from './Components/Timeline/ContractionTimelineCustom';
import { ContractionsHelpModal } from './Modals/HelpModal';
import { HistoryModal } from './Modals/HistoryModal';
import image from './Track.svg';
import classes from './Contractions.module.css';
import baseClasses from '@styles/base.module.css';

interface ContractionsProps {
  labour: LabourReadModel;
  isSubscriberView?: boolean;
  subscriberRole?: SubscriberRole;
}

const MESSAGES = {
  OWNER_TITLE: 'Track your contractions',
  OWNER_DESCRIPTION_ACTIVE:
    'Track your contractions here. Simply press the button below to start a new contraction. Click the book icon above for more info.',
  OWNER_DESCRIPTION_COMPLETED:
    "Here's a record of your contractions during labour. All contraction data is preserved for your reference.",
  OWNER_EMPTY_STATE: "You haven't logged any contractions yet",
  BIRTH_PARTNER_TITLE: (firstName: string) => `Track ${firstName}'s contractions`,
  BIRTH_PARTNER_DESCRIPTION_ACTIVE: (firstName: string) =>
    `Track ${firstName}'s contractions here. Simply press the button below to start a new contraction. Click the book icon above for more info.`,
  BIRTH_PARTNER_DESCRIPTION_COMPLETED: (firstName: string) =>
    `Here's a record of ${firstName}'s contractions during labour. All contraction data is preserved for your reference.`,
  BIRTH_PARTNER_EMPTY_STATE: (firstName: string) =>
    `You haven't logged any contractions for ${firstName} yet`,
};

export const Contractions = memo(
  ({ labour, isSubscriberView = false, subscriberRole }: ContractionsProps) => {
    const [helpOpened, { open: openHelp, close: closeHelp }] = useDisclosure(false);
    const [historyOpened, { open: openHistory, close: closeHistory }] = useDisclosure(false);
    const isTransitioning = useTransitionStatus();
    const hasInitialScrolled = useRef(false);

    const client = useLabourClient();
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useContractionsInfinite(
      client,
      labour.labour_id
    );

    const isBirthPartner = isSubscriberView && subscriberRole === SubscriberRole.BIRTH_PARTNER;
    const motherFirstName = labour.mother_name.split(' ')[0];

    const sortedContractions = useMemo(() => flattenContractions(data), [data]);

    const scrollToBottom = useCallback((smooth: boolean = false) => {
      setTimeout(() => {
        const main = document.getElementById('app-main');
        if (main) {
          main.scrollTo({ top: main.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
        }
      }, 50);
    }, []);

    useEffect(() => {
      if (sortedContractions.length === 0 || isTransitioning) {
        return;
      }

      const isInitialLoad = !hasInitialScrolled.current;

      if (isInitialLoad) {
        hasInitialScrolled.current = true;
      } else {
        scrollToBottom(true);
      }
    }, [sortedContractions.length, scrollToBottom, isTransitioning]);

    const handleLoadMore = () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    };

    const completed = labour.end_time !== null;
    const activeContraction = sortedContractions.find(
      (contraction) => contraction.duration.start_time === contraction.duration.end_time
    );

    const completedContractions = sortedContractions.filter(
      (c) => c.duration.start_time !== c.duration.end_time
    );
    const contractionCount = completedContractions.length;

    const hasContractions = sortedContractions.length > 0;
    const showEmptyState = !hasContractions && !completed;

    const title = isBirthPartner
      ? MESSAGES.BIRTH_PARTNER_TITLE(motherFirstName)
      : MESSAGES.OWNER_TITLE;

    const activeDescription = isBirthPartner
      ? MESSAGES.BIRTH_PARTNER_DESCRIPTION_ACTIVE(motherFirstName)
      : MESSAGES.OWNER_DESCRIPTION_ACTIVE;

    const completedDescription = isBirthPartner
      ? MESSAGES.BIRTH_PARTNER_DESCRIPTION_COMPLETED(motherFirstName)
      : MESSAGES.OWNER_DESCRIPTION_COMPLETED;

    const emptyStateMessage = isBirthPartner
      ? MESSAGES.BIRTH_PARTNER_EMPTY_STATE(motherFirstName)
      : MESSAGES.OWNER_EMPTY_STATE;

    return (
      <div className={baseClasses.root}>
        <div className={baseClasses.body}>
          {/* Header row with title and help button */}
          <div className={baseClasses.docsTitleRow}>
            <div className={classes.title} style={{ paddingBottom: 0 }}>
              <Title order={2} fz={{ base: 'h4', xs: 'h3', sm: 'h2' }}>
                {title}
              </Title>
            </div>
            <ActionIcon radius="xl" variant="light" size="xl" onClick={openHelp}>
              <IconBook />
            </ActionIcon>
            <ContractionsHelpModal close={closeHelp} opened={helpOpened} />
          </div>

          {/* Description and image */}
          <div className={baseClasses.inner} style={{ paddingBottom: 0, paddingTop: 0 }}>
            <div className={classes.content}>
              <Text fz={{ base: 'sm', sm: 'md' }} className={baseClasses.description}>
                {completed ? completedDescription : activeDescription}
              </Text>
              {hasContractions && !completed && (
                <Button
                  variant="light"
                  leftSection={<IconHistory size={16} />}
                  radius="xl"
                  onClick={openHistory}
                  mt="md"
                  mb="md"
                >
                  View history
                </Button>
              )}
            </div>
            {!hasContractions && (
              <div className={baseClasses.flexColumn}>
                <Image src={image} className={classes.image} />
              </div>
            )}
          </div>

          {/* Small image for mobile - only when not tracking */}
          {!hasContractions && (
            <>
              <Space h="sm" />
              <div className={baseClasses.imageFlexRow}>
                <Image src={image} className={classes.smallImage} />
              </div>
            </>
          )}

          <HistoryModal
            opened={historyOpened}
            onClose={closeHistory}
            contractions={sortedContractions}
            completed={completed}
            hasMore={hasNextPage}
            onLoadMore={handleLoadMore}
            isLoadingMore={isFetchingNextPage}
          />

          {/* Empty state message */}
          {showEmptyState && (
            <Text fz={{ base: 'sm', xs: 'md' }} className={baseClasses.emptyState}>
              {emptyStateMessage}
            </Text>
          )}

          {/* Stats and chart - only when we have contractions */}
          {hasContractions && !completed && (
            <>
              <Stack gap="md" className={classes.statsSection}>
                <ContractionStats contractions={sortedContractions} />
                <ContractionMiniChart contractions={sortedContractions} completed={completed} />
              </Stack>
              <div className={classes.alertSection}>
                <AlertContainer
                  contractions={sortedContractions}
                  firstLabour={labour.first_labour}
                />
              </div>
            </>
          )}

          {/* Status card - shows stats/message on mobile, controls on desktop */}
          {!completed && (
            <TrackingStatusCard
              activeContraction={activeContraction}
              lastContraction={completedContractions[completedContractions.length - 1]}
              contractionCount={contractionCount}
              completed={completed}
            />
          )}

          {/* Completed state */}
          {completed && hasContractions && (
            <>
              <Space h="md" />
              <ContractionTimelineCustom
                contractions={completedContractions}
                completed={completed}
                hasMore={false}
                onLoadMore={() => {}}
                isLoadingMore={false}
              />
            </>
          )}
        </div>
      </div>
    );
  }
);
