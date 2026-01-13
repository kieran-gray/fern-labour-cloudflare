import { motion } from 'motion/react';
import { Container, Stack, Text, Title } from '@mantine/core';
import { LabourUpdate } from '../../AppPreview/LabourUpdate';
import classes from './SimpleUpdates.module.css';

const STATUS_UPDATE = {
  id: 'status',
  sentTime: '2:30 PM',
  type: 'status' as const,
  badgeColor: 'teal',
  badgeText: 'Status Update',
  text: 'Contractions are about 5 mins apart now. Heading to the hospital!',
};

const ANNOUNCEMENT = {
  id: 'announcement',
  sentTime: '6:45 PM',
  type: 'announcement' as const,
  badgeColor: 'pink',
  badgeText: 'Announcement',
  text: "She's here! Baby Olivia arrived at 6:32 PM, 7lbs 4oz. Mum and baby doing wonderfully.",
};

const updates = [STATUS_UPDATE, ANNOUNCEMENT];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, x: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

export function SimpleUpdates() {
  return (
    <div className={classes.root}>
      <Container size="lg" className={classes.inner}>
        <motion.div
          className={classes.content}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          viewport={{ once: true, margin: '-10%' }}
        >
          <Title className={classes.title}>Share when it feels right</Title>
          <Text className={classes.description}>
            Send news when you're ready. With one tap everyone in your circle gets the same update,
            so you can get back to what matters.
          </Text>
        </motion.div>

        <motion.div
          className={classes.visual}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
        >
          <Stack gap="md">
            {updates.map((update) => (
              <motion.div key={update.id} className={classes.updateCard} variants={cardVariants}>
                <LabourUpdate data={update} />
              </motion.div>
            ))}
          </Stack>
        </motion.div>
      </Container>
    </div>
  );
}
