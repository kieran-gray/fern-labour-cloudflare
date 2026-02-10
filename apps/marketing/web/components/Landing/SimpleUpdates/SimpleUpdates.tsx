import { motion } from 'motion/react';
import { Container, Stack, Text, Title } from '@mantine/core';
import { fadeUp, slideLeft, staggerContainer } from '@/lib/motion';
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

export function SimpleUpdates() {
  return (
    <div className={classes.root}>
      <Container size="lg" className={classes.inner}>
        <motion.div
          className={classes.visual}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
        >
          <Stack gap="md">
            {updates.map((update) => (
              <motion.div key={update.id} className={classes.updateCard} variants={slideLeft}>
                <LabourUpdate data={update} />
              </motion.div>
            ))}
          </Stack>
        </motion.div>

        <motion.div
          className={classes.content}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
        >
          <Title className={classes.title}>Update everyone on your terms</Title>
          <Text className={classes.description}>
            Send news when you're ready. With one tap everyone in your circle gets the same update,
            so you can get back to what matters.
          </Text>
        </motion.div>
      </Container>
    </div>
  );
}
