import { IconBolt, IconDeviceMobile, IconHeart } from '@tabler/icons-react';
import { motion } from 'motion/react';
import { Container, Text } from '@mantine/core';
import classes from './SubscriberBenefits.module.css';

const benefits = [
  {
    icon: IconBolt,
    title: 'Instant Updates',
    description: "No ringing around. When there's news, you'll know instantly.",
    bgColor: 'var(--mantine-color-teal-0)',
    color: 'var(--mantine-color-teal-6)',
  },
  {
    icon: IconDeviceMobile,
    title: 'No extra apps',
    description: 'Updates come directly to your existing SMS or WhatsApp. No new apps.',
    bgColor: 'var(--mantine-color-indigo-0)',
    color: 'var(--mantine-color-indigo-6)',
  },
  {
    icon: IconHeart,
    title: 'Respectful Connection',
    description: 'Feel close, even from far away.',
    bgColor: 'var(--mantine-color-pink-0)',
    color: 'var(--mantine-color-pink-5)',
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
      ease: 'circIn' as const,
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

export function SubscriberBenefits() {
  return (
    <div className={classes.root}>
      <Container size="lg" className={classes.inner}>
        <motion.div
          className={classes.benefitsGrid}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
        >
          {benefits.map((benefit) => (
            <motion.div key={benefit.title} className={classes.benefitItem} variants={itemVariants}>
              <motion.div
                className={classes.iconWrapper}
                style={{ backgroundColor: benefit.bgColor, color: benefit.color }}
                variants={iconVariants}
              >
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
