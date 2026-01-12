import { IconChartBar, IconClick, IconUsersGroup } from '@tabler/icons-react';
import { motion } from 'motion/react';
import { Container, Text, Title } from '@mantine/core';
import classes from './MotherBenefits.module.css';

const benefits = [
  {
    icon: IconClick,
    title: 'Effortless Tracking',
    description:
      'One giant button. Tap to start, tap to stop. No distractions when you need focus.',
  },
  {
    icon: IconChartBar,
    title: 'Clear Insights',
    description:
      "We do the math. You see what matters: how you're progressing and when it's time to move.",
  },
  {
    icon: IconUsersGroup,
    title: 'Your Circle',
    description:
      'Share the moment with your chosen people. Invite your partner to track, and family to follow.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

const iconVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut' as const,
    },
  },
};

export function MotherBenefits() {
  return (
    <div className={classes.root}>
      <Container size="lg" className={classes.inner}>
        <motion.div
          className={classes.header}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          viewport={{ once: true, margin: '-10%' }}
        >
          <Title className={classes.title}>Designed for your labour.</Title>
        </motion.div>

        <motion.div
          className={classes.benefitsGrid}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
        >
          {benefits.map((benefit) => (
            <motion.div key={benefit.title} className={classes.benefitItem} variants={itemVariants}>
              <motion.div className={classes.iconWrapper} variants={iconVariants}>
                <benefit.icon size={30} />
              </motion.div>
              <Text className={classes.benefitTitle}>{benefit.title}</Text>
              <Text className={classes.benefitDescription}>{benefit.description}</Text>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </div>
  );
}
