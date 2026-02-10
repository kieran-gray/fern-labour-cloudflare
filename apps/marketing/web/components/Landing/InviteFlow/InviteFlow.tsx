import { useCallback, useState } from 'react';
import { motion } from 'motion/react';
import { Avatar, Container, Group, Stack, Text, Title } from '@mantine/core';
import { RoleBadge, SubscriberRole } from '@/components/AppPreview/RoleBadge';
import { fadeUp, slideRight } from '@/lib/motion';
import { SubscriberRequestFlow } from '../../AppPreview/SubscriberRequestFlow';
import classes from './InviteFlow.module.css';

interface Subscriber {
  id: string;
  initials: string;
  name: string;
  role: SubscriberRole;
  color: string;
}

const DEFAULT_SUBSCRIBERS: Subscriber[] = [
  {
    id: '1',
    initials: 'TJ',
    name: 'Tom Jenkins',
    role: SubscriberRole.BIRTH_PARTNER,
    color: 'pink',
  },
  { id: '2', initials: 'EW', name: 'Emily Wilson', role: SubscriberRole.LOVED_ONE, color: 'teal' },
];

const SARAH: Subscriber = {
  id: '3',
  initials: 'SM',
  name: 'Sarah Miller',
  role: SubscriberRole.LOVED_ONE,
  color: 'orange',
};

function SubscribedUsers({ subscribers }: { subscribers: Subscriber[] }) {
  return (
    <Stack gap="sm" w="100%">
      <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.5px' }}>
        Active Subscribers
      </Text>
      {subscribers.map((sub) => (
        <div key={sub.id} className={classes.subscriberCard}>
          <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
            <Avatar size={44} radius="xl" color={sub.color} variant="light">
              {sub.initials}
            </Avatar>
            <div style={{ minWidth: 0 }}>
              <Text fw={600} size="sm" className={classes.cropText}>
                {sub.name}
              </Text>
              <RoleBadge role={sub.role} />
            </div>
          </Group>
        </div>
      ))}
    </Stack>
  );
}

export function InviteFlow() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>(DEFAULT_SUBSCRIBERS);

  const handleAccept = useCallback(() => {
    setSubscribers((prev) => {
      if (prev.some((s) => s.id === SARAH.id)) {
        return prev;
      }
      return [...prev, SARAH];
    });
  }, []);

  const handleReset = useCallback(() => {
    setSubscribers(DEFAULT_SUBSCRIBERS);
  }, []);

  return (
    <div className={classes.root}>
      <Container size="lg" className={classes.inner}>
        <motion.div
          className={classes.content}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
        >
          <Title className={classes.title}>Gather your support circle</Title>
          <Text className={classes.description}>
            Choose who is part of your circle. When someone asks to join, you decide.
          </Text>
        </motion.div>

        <motion.div
          className={classes.visual}
          variants={slideRight}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
        >
          <Stack gap="lg" w="100%">
            <SubscriberRequestFlow onAccept={handleAccept} onReset={handleReset} />
            <SubscribedUsers subscribers={subscribers} />
          </Stack>
        </motion.div>
      </Container>
    </div>
  );
}
