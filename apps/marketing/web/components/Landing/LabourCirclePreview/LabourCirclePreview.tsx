import { motion } from 'motion/react';
import { Container, Text, Title } from '@mantine/core';
import { RoleBadge, SubscriberRole } from '../../AppPreview/RoleBadge';
import classes from './LabourCirclePreview.module.css';

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
  hidden: { opacity: 0, y: 16, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

const connectorVariants = {
  hidden: { scaleY: 0, opacity: 0 },
  visible: {
    scaleY: 1,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

export function LabourCirclePreview() {
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
          <Title className={classes.title}>One moment shared with your inner circle.</Title>
          <Text className={classes.description}>
            You and your birth partner track together. Your wider family stays close, without
            interrupting.
          </Text>
        </motion.div>

        <motion.div
          className={classes.visual}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          viewport={{ once: true, margin: '-10%' }}
        >
          <motion.div
            className={classes.diagramContainer}
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-10%' }}
          >
            <motion.div className={classes.roleCard} variants={cardVariants}>
              <RoleBadge role={SubscriberRole.BIRTH_PARTNER} />
              <div className={classes.roleText}>
                <Text size="sm" fw={600}>
                  Birth Partner
                </Text>
                <Text size="xs" c="dimmed">
                  Tracks & Updates
                </Text>
              </div>
            </motion.div>

            <motion.div
              className={classes.connector}
              variants={connectorVariants}
              style={{ originY: 0 }}
            />

            <motion.div className={classes.roleCard} variants={cardVariants}>
              <RoleBadge role={SubscriberRole.LOVED_ONE} />
              <div className={classes.roleText}>
                <Text size="sm" fw={600}>
                  Family & Friends
                </Text>
                <Text size="xs" c="dimmed">
                  Follows Updates
                </Text>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </Container>
    </div>
  );
}
