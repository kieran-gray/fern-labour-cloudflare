import { motion } from 'motion/react';
import { Container, Text, Title } from '@mantine/core';
import { ContactMethodItem } from '../../AppPreview/ContactMethods';
import classes from './SubscriberExperience.module.css';

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
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

export function SubscriberExperience() {
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
          <Title className={classes.title}>
            Be there, without being <i>in there</i>.
          </Title>
          <Text className={classes.description}>
            The constant check-ins can add pressure. Let her focus. She shares the news once and it
            reaches everyone instantly through SMS or WhatsApp.
          </Text>
        </motion.div>

        <motion.div
          className={classes.actions}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
        >
          <div className={classes.methodsRow}>
            <motion.div variants={itemVariants}>
              <ContactMethodItem type="WHATSAPP" />
            </motion.div>
            <motion.div variants={itemVariants}>
              <ContactMethodItem type="SMS" />
            </motion.div>
          </div>
        </motion.div>
      </Container>
    </div>
  );
}
