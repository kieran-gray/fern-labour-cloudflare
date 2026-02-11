'use client';

import { ReactNode } from 'react';
import NextLink from 'next/link';
import {
  IconBellRinging,
  IconDeviceMobileMessage,
  IconMessage,
  IconMoodSmileBeam,
  IconUser,
  IconUsers,
} from '@tabler/icons-react';
import { motion } from 'motion/react';
import {
  Box,
  Button,
  Card,
  CardProps,
  Center,
  Container,
  Divider,
  Flex,
  Group,
  Stack,
  Text,
} from '@mantine/core';
import { fadeUp, scaleUp, staggerContainer } from '@/lib/motion';
import { JumboTitle } from '../../JumboTitle/JumboTitle';
import { SectionSeparator } from '../../SectionSeparator/SectionSeparator';
import classes from './Pricing.module.css';

const Icon = ({ children }: { children: ReactNode }) => (
  <Card radius="xl" p="sm" withBorder>
    <Center>{children}</Center>
  </Card>
);

const PricingCard = ({
  cta,
  description,
  icon,
  items,
  price,
  pricingPeriod,
  title,
  shadow,
}: {
  cta: ReactNode;
  description: string;
  icon: ReactNode;
  items: Array<{
    description: string;
    icon: ReactNode;
    title: string;
  }>;
  price: string;
  pricingPeriod: string;
  shadow?: CardProps['shadow'];
  title: string;
}) => (
  <Card radius="xl" shadow={shadow} w="100%" withBorder className={classes.root}>
    <Group justify="space-between" align="start" mb="md">
      <Box>{icon}</Box>
    </Group>
    <Text fz="xl" fw="bold">
      {title}
    </Text>
    {description && (
      <Text mb="md" c="dimmed" fz="sm">
        {description}
      </Text>
    )}
    <Flex align="end" gap="xs" mt={description ? 0 : 'md'}>
      <JumboTitle my={0} order={2} fz="md" mb="sm" c="var(--mantine-color-pink-4)">
        {price}
      </JumboTitle>
      {pricingPeriod && (
        <Text c="dimmed" span>
          {pricingPeriod}
        </Text>
      )}
    </Flex>
    <Card.Section my="lg">
      <Divider />
    </Card.Section>
    <Stack>
      {items.map((item) => (
        <Group key={item.title} gap="xs">
          <Box>{item.icon}</Box>
          <Stack gap={0}>
            <Text fw={500}>{item.title}</Text>
            <Text c="dimmed" fz="sm" inline>
              {item.description}
            </Text>
          </Stack>
        </Group>
      ))}
    </Stack>
    <Card.Section my="lg">
      <Divider />
    </Card.Section>
    <Box>{cta}</Box>
  </Card>
);

type Pricing01Props = {
  title: string;
  description: string;
  callToActionUrl?: string;
};

export const Pricing01 = ({ title, description, callToActionUrl = '#' }: Pricing01Props) => {
  return (
    <div style={{ position: 'relative', backgroundColor: 'var(--mantine-color-pink-0)' }}>
      <SectionSeparator position="top" color="#fff5f5" style={{ zIndex: 1 }} />
      <Container py={120} px="15px" fluid>
        <Container size="md" style={{ position: 'relative' }}>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-10%' }}
          >
            <Stack align="center" gap="xs">
              <JumboTitle order={2} fz="xs" ta="center" style={{ textWrap: 'balance' }}>
                {title}
              </JumboTitle>
              <Text
                c="var(--mantine-color-gray-7)"
                ta="center"
                fz="lg"
                style={{ textWrap: 'balance' }}
              >
                {description}
              </Text>
            </Stack>
          </motion.div>
        </Container>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
        >
          <Group
            mt="calc(var(--mantine-spacing-lg) * 2)"
            justify="center"
            gap="lg"
            wrap="wrap"
            px="md"
          >
            <motion.div variants={scaleUp} className={classes.pricingCardWrapper}>
              <PricingCard
                shadow="sm"
                title="The App"
                description="For you and your circle"
                cta={
                  <Button
                    component={NextLink}
                    href={callToActionUrl}
                    size="lg"
                    radius="xl"
                    variant="light"
                    fullWidth
                  >
                    Start tracking
                  </Button>
                }
                icon={
                  <Icon>
                    <IconUser size={21} />
                  </Icon>
                }
                price="Free"
                pricingPeriod="forever"
                items={[
                  {
                    title: 'Unlimited tracking',
                    description: 'Track all your contractions',
                    icon: (
                      <Icon>
                        <IconMoodSmileBeam size={21} />
                      </Icon>
                    ),
                  },
                  {
                    title: 'Invite your circle',
                    description: 'Share with family and friends',
                    icon: (
                      <Icon>
                        <IconUsers size={21} />
                      </Icon>
                    ),
                  },
                  {
                    title: 'Real-time updates',
                    description: 'Syncs across all devices',
                    icon: (
                      <Icon>
                        <IconDeviceMobileMessage size={21} />
                      </Icon>
                    ),
                  },
                ]}
              />
            </motion.div>
            <motion.div variants={scaleUp} className={classes.pricingCardWrapper}>
              <PricingCard
                shadow="sm"
                title="SMS & WhatsApp"
                description="Optional upgrade for subscribers"
                cta={
                  <Button
                    component={NextLink}
                    href={callToActionUrl}
                    radius="xl"
                    size="lg"
                    variant="light"
                    fullWidth
                  >
                    Get notifications
                  </Button>
                }
                icon={
                  <Icon>
                    <IconBellRinging size={21} />
                  </Icon>
                }
                price="£2.50"
                pricingPeriod="one-time"
                items={[
                  {
                    title: 'Instant SMS alerts',
                    description: 'Notify your circle via text',
                    icon: (
                      <Icon>
                        <IconMessage size={21} />
                      </Icon>
                    ),
                  },
                  {
                    title: 'WhatsApp messages',
                    description: 'Send updates via WhatsApp',
                    icon: (
                      <Icon>
                        <IconDeviceMobileMessage size={21} />
                      </Icon>
                    ),
                  },
                  {
                    title: 'Paid by subscriber',
                    description: 'One-time fee per subscriber',
                    icon: (
                      <Icon>
                        <IconUser size={21} />
                      </Icon>
                    ),
                  },
                ]}
              />
            </motion.div>
          </Group>
        </motion.div>
      </Container>
    </div>
  );
};
