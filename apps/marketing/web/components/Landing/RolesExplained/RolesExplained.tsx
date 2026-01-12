import { motion } from 'motion/react';
import { Container, Text, Title } from '@mantine/core';
import { RoleBadge, SubscriberRole } from '../../AppPreview/RoleBadge';
import classes from './RolesExplained.module.css';

const roles = [
  {
    role: SubscriberRole.BIRTH_PARTNER,
    description:
      'Can track contractions and send updates on your behalf — your partner in the room.',
  },
  {
    role: SubscriberRole.SUPPORT_PERSON,
    description:
      'Sees detailed updates and contraction stats — for those who want to follow closely.',
  },
  {
    role: SubscriberRole.LOVED_ONE,
    description: 'Sees your updates and announcements — just the news, not the numbers.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
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

export function RolesExplained() {
  return (
    <div className={classes.root}>
      <Container size="lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          viewport={{ once: true, margin: '-10%' }}
        >
          <Title className={classes.title}>Different roles, different access</Title>
          <Text className={classes.subtitle}>You decide what each person can see and do.</Text>
        </motion.div>

        <motion.div
          className={classes.grid}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
        >
          {roles.map((item) => (
            <motion.div key={item.role} className={classes.card} variants={cardVariants}>
              <RoleBadge role={item.role} />
              <Text className={classes.roleDescription}>{item.description}</Text>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </div>
  );
}
