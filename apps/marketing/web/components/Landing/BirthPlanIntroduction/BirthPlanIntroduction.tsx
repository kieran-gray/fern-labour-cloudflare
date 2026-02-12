import { motion } from 'motion/react';
import { Container, Text, Title } from '@mantine/core';
import { fadeUp } from '@/lib/motion';
import classes from './BirthPlanIntroduction.module.css';

export function BirthPlanIntroduction() {
  return (
    <div className={classes.root}>
      <Container size="md" className={classes.inner}>
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
        >
          <Text className={classes.label}>LOOKING AHEAD</Text>
          <Title className={classes.title}>Make your wishes clear</Title>
          <Text className={classes.description}>
            Turn what matters to you into a calm, clear birth plan your care team can follow at a
            glance.
          </Text>
        </motion.div>
      </Container>
    </div>
  );
}
