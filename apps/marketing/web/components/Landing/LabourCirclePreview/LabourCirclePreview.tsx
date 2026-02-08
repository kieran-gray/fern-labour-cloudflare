import { motion } from 'motion/react';
import { Container, Text, Title } from '@mantine/core';
import { fadeUp, scaleUp, staggerContainer } from '@/lib/motion';
import { RoleBadge, SubscriberRole } from '../../AppPreview/RoleBadge';
import classes from './LabourCirclePreview.module.css';

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
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
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
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
        >
          <motion.div
            className={classes.diagramContainer}
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-10%' }}
          >
            <motion.div className={classes.roleCard} variants={scaleUp}>
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

            <motion.div className={classes.roleCard} variants={scaleUp}>
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
