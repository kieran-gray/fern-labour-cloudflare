import { useEffect, useState } from 'react';
import { IconCheck, IconX } from '@tabler/icons-react';
import { AnimatePresence, motion } from 'motion/react';
import { ActionIcon, Avatar, Group, Text, Tooltip } from '@mantine/core';
import classes from './SubscriberRequestFlow.module.css';

interface SubscriberData {
  firstName: string;
  lastName: string;
}

const subscriber: SubscriberData = {
  firstName: 'Sarah',
  lastName: 'Miller',
};

function PendingRequestCard({
  onApprove,
  onReject,
}: {
  onApprove: () => void;
  onReject: () => void;
}) {
  const name = `${subscriber.firstName} ${subscriber.lastName}`;
  const initials = `${subscriber.firstName[0]}${subscriber.lastName[0]}`;

  return (
    <div className={classes.pendingCard}>
      <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
        <Avatar size={44} radius="xl" color="orange" variant="light">
          {initials}
        </Avatar>
        <div style={{ minWidth: 0 }}>
          <Text fw={600} size="sm" className={classes.cropText}>
            {name}
          </Text>
          <Text size="xs" className={classes.subtleText}>
            wants to join your circle
          </Text>
        </div>
      </Group>
      <Group gap="xs" wrap="nowrap">
        <Tooltip label="Accept">
          <ActionIcon
            variant="filled"
            color="teal"
            size="lg"
            radius="xl"
            onClick={onApprove}
            aria-label="Accept"
          >
            <IconCheck size={18} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="Decline">
          <ActionIcon
            variant="light"
            color="red"
            size="lg"
            radius="xl"
            onClick={onReject}
            aria-label="Decline"
          >
            <IconX size={18} />
          </ActionIcon>
        </Tooltip>
      </Group>
    </div>
  );
}

interface SubscriberRequestFlowProps {
  onAccept?: () => void;
  onReset?: () => void;
}

export function SubscriberRequestFlow({ onAccept, onReset }: SubscriberRequestFlowProps) {
  const [state, setState] = useState<'pending' | 'accepted' | 'rejected'>('pending');

  const handleApprove = () => {
    setState('accepted');
    onAccept?.();
  };

  const handleReject = () => {
    setState('rejected');
  };

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (state === 'accepted' || state === 'rejected') {
      timeout = setTimeout(() => {
        setState('pending');
        onReset?.();
      }, 4000);
    }
    return () => clearTimeout(timeout);
  }, [state, onReset]);

  return (
    <div style={{ width: '100%' }}>
      <AnimatePresence mode="wait">
        {state === 'pending' ? (
          <motion.div
            key="pending"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className={classes.pendingSection}>
              <Text size="xs" fw={600} className={classes.pendingLabel}>
                1 person wants to join
              </Text>
              <PendingRequestCard onApprove={handleApprove} onReject={handleReject} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="exit"
            initial={{ height: 'auto', opacity: 1 }}
            animate={{ height: 0, opacity: 0, margin: 0 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
