import { memo, useEffect, useMemo } from 'react';
import { LabourReadModel, SubscriberRole } from '@base/clients/labour_service/types';
import { useLabourClient } from '@base/hooks';
import { flattenContractions, useContractionsInfinite } from '@base/hooks/useInfiniteQueries';
import { useTransitionStatus } from '@components/TabTransition/TransitionStatusContext';
import { IconBook } from '@tabler/icons-react';
import { ActionIcon, Image, Stack, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { AlertContainer } from './Alerts';
import { ContractionControls } from './ContractionControls';
import ContractionTimelineCustom from './ContractionTimelineCustom';
import { ContractionsHelpModal } from './HelpModal';
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
    const [opened, { open, close }] = useDisclosure(false);

    const client = useLabourClient();
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useContractionsInfinite(
      client,
      labour.labour_id
    );
    const isTransitioning = useTransitionStatus();

    const isBirthPartner = isSubscriberView && subscriberRole === SubscriberRole.BIRTH_PARTNER;
    const motherFirstName = labour.mother_name.split(' ')[0];

    const sortedContractions = useMemo(() => flattenContractions(data), [data]);

    const handleLoadMore = () => {
      if (hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    };

    useEffect(() => {
      if (isTransitioning) {
        return;
      }
      const main = document.getElementById('app-main');
      if (main) {
        main.scrollTo({ top: main.scrollHeight, behavior: 'smooth' });
      }
    }, [labour, isTransitioning]);

    const completed = labour.end_time !== null;
    const activeContraction = sortedContractions.find(
      (contraction) => contraction.duration.start_time === contraction.duration.end_time
    );

    useEffect(() => {
      if (isTransitioning) {
        return;
      }
      if (activeContraction) {
        const main = document.getElementById('app-main');
        if (main) {
          main.scrollTo({ top: main.scrollHeight, behavior: 'smooth' });
        }
      }
    }, [activeContraction?.contraction_id, isTransitioning]);

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
          <div className={baseClasses.docsTitleRow}>
            <div className={classes.title}>
              <Title order={2} fz={{ base: 'h4', xs: 'h3', sm: 'h2' }}>
                {title}
              </Title>
            </div>
            <ActionIcon radius="xl" variant="light" size="xl" onClick={open}>
              <IconBook />
            </ActionIcon>
            <ContractionsHelpModal close={close} opened={opened} />
          </div>
          <div className={classes.content}>
            {(completed || sortedContractions.length === 0) && (
              <Text fz={{ base: 'sm', xs: 'md' }} className={baseClasses.description}>
                {completed ? completedDescription : activeDescription}
              </Text>
            )}
            <Stack align="center" justify="flex-end" mt="md">
              {sortedContractions.length > 0 && (
                <ContractionTimelineCustom
                  contractions={sortedContractions}
                  completed={completed}
                  hasMore={hasNextPage}
                  onLoadMore={handleLoadMore}
                  isLoadingMore={isFetchingNextPage}
                />
              )}
              {sortedContractions.length === 0 && !completed && (
                <div className={classes.emptyState}>
                  <div className={classes.imageFlexRow}>
                    <Image src={image} className={classes.image} />
                  </div>
                  <Text fz={{ base: 'sm', xs: 'md' }} className={baseClasses.importantText}>
                    {emptyStateMessage}
                  </Text>
                </div>
              )}
            </Stack>
            <Stack
              align="stretch"
              justify="flex-end"
              mt={sortedContractions.length === 0 ? 0 : 'md'}
            >
              {!completed && (
                <AlertContainer
                  contractions={sortedContractions}
                  firstLabour={labour.first_labour}
                />
              )}
              <div className={classes.desktopControls}>
                <ContractionControls
                  labourCompleted={completed}
                  activeContraction={activeContraction}
                />
              </div>
            </Stack>
          </div>
        </div>
      </div>
    );
  }
);
