import { IconChartBar, IconClick, IconUsersGroup } from '@tabler/icons-react';
import { motion } from 'motion/react';
import { Container, Text, Title } from '@mantine/core';
import { fadeUp, iconPop, staggerContainer } from '@/lib/motion';
import classes from './MotherBenefits.module.css';

const benefits = [
  {
    icon: IconClick,
    title: 'Simple Tracking',
    description: 'Tap to start, tap to stop. No distractions when you need focus.',
  },
  {
    icon: IconChartBar,
    title: 'Clear Insights',
    description:
      'We handle the numbers, giving you a clear picture of your progress and when to prepare for the next steps.',
  },
  {
    icon: IconUsersGroup,
    title: 'Your Circle',
    description:
      'Share the moment with your chosen people. Invite your partner to track, and family to follow.',
  },
];

export function MotherBenefits() {
  return (
    <div className={classes.root}>
      <Container size="lg" className={classes.inner}>
        <motion.div
          className={classes.header}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
        >
          <Title className={classes.title}>Designed for your labour</Title>
        </motion.div>

        <motion.div
          className={classes.benefitsGrid}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
        >
          {benefits.map((benefit) => (
            <motion.div key={benefit.title} className={classes.benefitItem} variants={fadeUp}>
              <motion.div className={classes.iconWrapper} variants={iconPop}>
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
