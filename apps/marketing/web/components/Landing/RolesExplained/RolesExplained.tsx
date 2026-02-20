import { motion } from 'motion/react';
import { Container, Text, Title } from '@mantine/core';
import { fadeUp, scaleUp, staggerContainer } from '@/lib/motion';
import { RoleBadge, SubscriberRole } from '../../AppPreview/RoleBadge';
import classes from './RolesExplained.module.css';

const roles = [
  {
    role: SubscriberRole.BIRTH_PARTNER,
    description: 'For the person by your side. They can track and update on your behalf.',
  },
  {
    role: SubscriberRole.SUPPORT_PERSON,
    description: 'For those that need the details. They see your updates and contraction patterns.',
  },
  {
    role: SubscriberRole.LOVED_ONE,
    description: 'Just the news, not the numbers. They see your updates and announcements only.',
  },
];

export function RolesExplained() {
  return (
    <div className={classes.root}>
      <Container size="lg">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
        >
          <Title className={classes.title}>The right details, for the right people</Title>
          <Text className={classes.subtitle}>You decide what each person can see and do.</Text>
        </motion.div>

        <motion.div
          className={classes.grid}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
        >
          {roles.map((item) => (
            <motion.div key={item.role} className={classes.card} variants={scaleUp}>
              <RoleBadge role={item.role} />
              <Text className={classes.roleDescription}>{item.description}</Text>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </div>
  );
}
