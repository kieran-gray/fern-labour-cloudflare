import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  LabourReadModel,
  LabourUpdateReadModel,
  SubscriberRole,
} from '@base/clients/labour_service';
import { useLabourClient } from '@base/hooks';
import { flattenLabourUpdates, useLabourUpdatesInfinite } from '@base/hooks/useInfiniteQueries';
import { pluraliseName } from '@lib';
import { IconBook } from '@tabler/icons-react';
import { ActionIcon, Button, Image, ScrollArea, Space, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { LabourUpdate, LabourUpdateProps } from './LabourUpdate';
import { LabourUpdateControls } from './LabourUpdateControls';
import { LabourUpdatesHelpModal } from './Modals/HelpModal';
import image from './updates.svg';
import classes from './LabourUpdates.module.css';
import baseClasses from '@styles/base.module.css';

interface LabourUpdatesProps {
  labour: LabourReadModel;
  isSubscriberView?: boolean;
  subscriberRole?: SubscriberRole;
}

const MESSAGES = {
  SHARED_LABOUR_BEGUN: (firstName: string) => `Exciting news, ${firstName} has started labour!`,
  PRIVATE_LABOUR_BEGUN:
    "You're now tracking contractions! Use the announce button on this message to let your subscribers know that labour has started!",
  OWNER_TITLE_ACTIVE: 'Share an update',
  OWNER_TITLE_COMPLETED: 'Your labour updates',
  OWNER_DESCRIPTION_ACTIVE:
    'Share updates here to let your subscribers know how you are getting on. Click the book icon above for more info.',
  OWNER_DESCRIPTION_COMPLETED:
    'Here you can see the updates you made during your labour experience.',
  OWNER_EMPTY_STATE: "You haven't posted any updates yet.",
  BIRTH_PARTNER_LABOUR_BEGUN: (firstName: string) =>
    `You're now tracking ${firstName}'s contractions! Use the announce button on this message to let subscribers know that labour has started!`,
  BIRTH_PARTNER_TITLE_ACTIVE: (firstName: string) => `Share an update about ${firstName}`,
  BIRTH_PARTNER_TITLE_COMPLETED: (firstName: string) => `${firstName}'s labour updates`,
  BIRTH_PARTNER_DESCRIPTION_ACTIVE: (firstName: string) =>
    `Share updates here to let subscribers know how ${firstName} is getting on. Click the book icon above for more info.`,
  BIRTH_PARTNER_DESCRIPTION_COMPLETED: (firstName: string) =>
    `Here you can see the updates you made during ${firstName}'s labour experience.`,
  BIRTH_PARTNER_EMPTY_STATE: (firstName: string) =>
    `You haven't posted any updates about ${firstName} yet.`,
  SUBSCRIBER_TITLE: (possessiveName: string) => `${possessiveName} status updates`,
  SUBSCRIBER_DESCRIPTION_ACTIVE: (firstName: string) =>
    `Curious about how things are going? ${firstName} can update her status here, giving you a glimpse into her progress. Check in regularly to stay informed without needing to reach out directly.`,
  SUBSCRIBER_DESCRIPTION_COMPLETED: (firstName: string) =>
    `Here's where ${firstName} kept everyone in the loop during her labour. These were her in-the-moment thoughts and progress notes that you checked in on.`,
  SUBSCRIBER_EMPTY_STATE: (firstName: string) => `${firstName} hasn't posted any updates yet.`,
};

const mapLabourUpdateToProps = (
  update: LabourUpdateReadModel,
  sharedLabourBegunMessage: string,
  privateLabourBegunMessage: string,
  completed: boolean,
  isSubscriberView: boolean
): LabourUpdateProps => {
  const sentTime = new Date(update.created_at).toLocaleString().slice(0, 17).replace(',', ' at');
  const baseProps = {
    id: update.labour_update_id,
    sentTime,
    visibility: isSubscriberView ? '' : undefined,
    showMenu: isSubscriberView ? false : undefined,
    showFooter: !isSubscriberView,
  };

  switch (update.labour_update_type) {
    case 'ANNOUNCEMENT':
      if (update.application_generated) {
        return {
          ...baseProps,
          class: classes.privateNotePanel,
          badgeColor: '#ff8f00',
          badgeText: 'Fern Labour',
          text: sharedLabourBegunMessage,
          visibility: isSubscriberView ? '' : 'Broadcast to subscribers',
          showMenu: false,
          showFooter: !isSubscriberView,
        };
      }
      return {
        ...baseProps,
        class: classes.announcementPanel,
        badgeColor: isSubscriberView
          ? 'var(--mantine-primary-color-6)'
          : 'var(--mantine-color-pink-6)',
        badgeText: update.labour_update_type.split('_')[0],
        text: update.message,
        visibility: isSubscriberView ? '' : 'Broadcast to subscribers',
        showMenu: false,
        showFooter: !isSubscriberView,
      };

    case 'STATUS_UPDATE':
      return {
        ...baseProps,
        class: classes.statusUpdatePanel,
        badgeColor: '#24968b',
        badgeText: update.labour_update_type.split('_')[0],
        text: update.message,
        visibility: isSubscriberView ? '' : 'Visible to subscribers',
        showMenu: isSubscriberView ? false : !completed,
        showFooter: !isSubscriberView,
      };

    default:
      return {
        ...baseProps,
        class: classes.privateNotePanel,
        badgeColor: '#ff8f00',
        badgeText: 'Fern Labour',
        text: privateLabourBegunMessage,
        visibility: isSubscriberView ? '' : 'Only visible to you',
        showMenu: isSubscriberView ? false : !completed,
        showFooter: !isSubscriberView,
      };
  }
};

export function LabourUpdates({
  labour,
  isSubscriberView = false,
  subscriberRole,
}: LabourUpdatesProps) {
  const [opened, { open, close }] = useDisclosure(false);
  const viewport = useRef<HTMLDivElement>(null);

  const isOwnerView = !isSubscriberView || subscriberRole === SubscriberRole.BIRTH_PARTNER;
  const isBirthPartner = isSubscriberView && subscriberRole === SubscriberRole.BIRTH_PARTNER;

  const client = useLabourClient();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useLabourUpdatesInfinite(
    client,
    labour.labour_id
  );

  const labourUpdates = useMemo(() => flattenLabourUpdates(data), [data]);

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const motherFirstName = labour.mother_name.split(' ')[0];
  const completed = labour.end_time != null;

  const sharedLabourBegunMessage = useMemo(
    () => MESSAGES.SHARED_LABOUR_BEGUN(motherFirstName),
    [motherFirstName]
  );

  const privateLabourBegunMessage = isBirthPartner
    ? MESSAGES.BIRTH_PARTNER_LABOUR_BEGUN(motherFirstName)
    : MESSAGES.PRIVATE_LABOUR_BEGUN;

  const scrollToBottom = useCallback((smooth: boolean = false) => {
    setTimeout(() => {
      if (viewport.current) {
        viewport.current.scrollTo({
          top: viewport.current.scrollHeight,
          behavior: smooth ? 'smooth' : 'auto',
        });
      }

      const main = document.getElementById('app-main');
      if (main) {
        main.scrollTo({ top: main.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
      }
    }, 50);
  }, []);

  const labourUpdateDisplay = useMemo(() => {
    const filteredUpdates = isOwnerView
      ? labourUpdates
      : labourUpdates.filter(
          (update) =>
            update.labour_update_type === 'ANNOUNCEMENT' ||
            update.labour_update_type === 'STATUS_UPDATE'
        );

    return filteredUpdates.map((data) => {
      return (
        <LabourUpdate
          data={mapLabourUpdateToProps(
            data,
            sharedLabourBegunMessage,
            privateLabourBegunMessage,
            completed,
            !isOwnerView
          )}
          key={data.labour_update_id}
        />
      );
    });
  }, [labourUpdates, sharedLabourBegunMessage, privateLabourBegunMessage, completed, isOwnerView]);

  const newestUpdateId =
    labourUpdates.length > 0 ? labourUpdates[labourUpdates.length - 1].labour_update_id : null;
  const prevNewestIdRef = useRef<string | null>(null);
  const hasInitiallyScrolledRef = useRef(false);

  useEffect(() => {
    if (labourUpdates.length === 0) {
      return;
    }

    const isInitialLoad = !hasInitiallyScrolledRef.current;
    const hasNewUpdate =
      newestUpdateId !== prevNewestIdRef.current && prevNewestIdRef.current !== null;

    if (isInitialLoad) {
      scrollToBottom(false);
      hasInitiallyScrolledRef.current = true;
    } else if (hasNewUpdate) {
      scrollToBottom(true);
    }

    prevNewestIdRef.current = newestUpdateId;
  }, [labourUpdates.length, newestUpdateId, scrollToBottom]);

  const title = !isSubscriberView
    ? completed
      ? MESSAGES.OWNER_TITLE_COMPLETED
      : MESSAGES.OWNER_TITLE_ACTIVE
    : isBirthPartner
      ? completed
        ? MESSAGES.BIRTH_PARTNER_TITLE_COMPLETED(motherFirstName)
        : MESSAGES.BIRTH_PARTNER_TITLE_ACTIVE(motherFirstName)
      : MESSAGES.SUBSCRIBER_TITLE(pluraliseName(motherFirstName));

  const description = !isSubscriberView
    ? completed
      ? MESSAGES.OWNER_DESCRIPTION_COMPLETED
      : MESSAGES.OWNER_DESCRIPTION_ACTIVE
    : isBirthPartner
      ? completed
        ? MESSAGES.BIRTH_PARTNER_DESCRIPTION_COMPLETED(motherFirstName)
        : MESSAGES.BIRTH_PARTNER_DESCRIPTION_ACTIVE(motherFirstName)
      : completed
        ? MESSAGES.SUBSCRIBER_DESCRIPTION_COMPLETED(motherFirstName)
        : MESSAGES.SUBSCRIBER_DESCRIPTION_ACTIVE(motherFirstName);

  const emptyStateMessage = !isSubscriberView
    ? MESSAGES.OWNER_EMPTY_STATE
    : isBirthPartner
      ? MESSAGES.BIRTH_PARTNER_EMPTY_STATE(motherFirstName)
      : MESSAGES.SUBSCRIBER_EMPTY_STATE(motherFirstName);

  const hasUpdates = labourUpdateDisplay.length > 0;
  const showOwnerEmptyState = !hasUpdates && !completed && isOwnerView;

  return (
    <div className={baseClasses.root}>
      <div className={baseClasses.body}>
        {isOwnerView ? (
          <>
            <div className={classes.titleRow}>
              <div className={classes.title} style={{ paddingBottom: 0 }}>
                <Title order={2} fz={{ base: 'h4', xs: 'h3', sm: 'h2' }}>
                  {title}
                </Title>
              </div>
              <ActionIcon radius="xl" variant="light" size="xl" onClick={open}>
                <IconBook />
              </ActionIcon>
              <LabourUpdatesHelpModal close={close} opened={opened} />
            </div>
            <div className={baseClasses.inner} style={{ paddingTop: 0, paddingBottom: 0 }}>
              <div className={classes.content}>
                <Text fz={{ base: 'sm', sm: 'md' }} className={baseClasses.description}>
                  {description}
                </Text>
                {hasUpdates && (
                  <ScrollArea.Autosize mt={20} mah="calc(100dvh - 370px)" viewportRef={viewport}>
                    {hasNextPage && (
                      <Button
                        onClick={handleLoadMore}
                        variant="light"
                        mb="md"
                        fullWidth
                        loading={isFetchingNextPage}
                        disabled={isFetchingNextPage}
                      >
                        {isFetchingNextPage ? 'Loading...' : 'Load older updates'}
                      </Button>
                    )}
                    <div className={classes.statusUpdateContainer}>{labourUpdateDisplay}</div>
                  </ScrollArea.Autosize>
                )}
                {showOwnerEmptyState && (
                  <>
                    <div className={classes.imageFlexRow}>
                      <Image src={image} className={classes.image} />
                    </div>
                    <Text
                      fz={{ base: 'sm', xs: 'md' }}
                      className={baseClasses.importantText}
                      style={{ display: 'flex', alignItems: 'center' }}
                    >
                      {emptyStateMessage}
                    </Text>
                  </>
                )}

                <div className={classes.desktopControls}>
                  {!completed && <LabourUpdateControls />}
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={baseClasses.inner}>
              <div className={classes.content}>
                <Title order={2} fz={{ base: 'h4', xs: 'h3', sm: 'h2' }}>
                  {title}
                </Title>
                <Text fz={{ base: 'sm', sm: 'md' }} className={baseClasses.description} mt={10}>
                  {description}
                </Text>
                <Space h="lg" />
                {hasUpdates ? (
                  <>
                    <ScrollArea.Autosize mah="calc(100dvh - 390px)" viewportRef={viewport}>
                      {hasNextPage && (
                        <Button
                          onClick={handleLoadMore}
                          variant="light"
                          mb="md"
                          fullWidth
                          loading={isFetchingNextPage}
                          disabled={isFetchingNextPage}
                        >
                          {isFetchingNextPage ? 'Loading...' : 'Load older updates'}
                        </Button>
                      )}
                      <div className={classes.statusUpdateContainer}>{labourUpdateDisplay}</div>
                    </ScrollArea.Autosize>
                    <Space h="lg" />
                  </>
                ) : (
                  <Text fz={{ base: 'sm', xs: 'md' }} className={baseClasses.importantText}>
                    {emptyStateMessage}
                  </Text>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
