import { motion } from 'motion/react';
import { Container, Text, Title } from '@mantine/core';
import { RoleBadge, SubscriberRole } from '../../AppPreview/RoleBadge';
import classes from './RolesExplained.module.css';

const roles = [
  {
    role: SubscriberRole.BIRTH_PARTNER,
    description: 'For the person by your side. They can track and update on your behalf.',
  },
  {
    role: SubscriberRole.SUPPORT_PERSON,
    description: 'For those following closely. They see your updates and contraction patterns.',
  },
  {
    role: SubscriberRole.LOVED_ONE,
    description: 'Just the news, not the numbers. They see your updates and announcements only.',
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
          <Title className={classes.title}>The right details, for the right people</Title>
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
