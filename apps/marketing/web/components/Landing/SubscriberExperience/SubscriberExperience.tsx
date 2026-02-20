import { motion } from 'motion/react';
import { Container, Text, Title } from '@mantine/core';
import { fadeUp, staggerContainer } from '@/lib/motion';
import { ContactMethodItem } from '../../AppPreview/ContactMethods';
import classes from './SubscriberExperience.module.css';

export function SubscriberExperience() {
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
          <Title className={classes.title}>
            Be there, without being <i>in there</i>
          </Title>
          <Text className={classes.description}>
            The constant check-ins can add pressure. Let her focus. She shares the news once and it
            reaches everyone instantly through SMS or WhatsApp.
          </Text>
        </motion.div>

        <motion.div
          className={classes.actions}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
        >
          <div className={classes.methodsRow}>
            <motion.div variants={fadeUp}>
              <ContactMethodItem type="WHATSAPP" />
            </motion.div>
            <motion.div variants={fadeUp}>
              <ContactMethodItem type="SMS" />
            </motion.div>
          </div>
        </motion.div>
      </Container>
    </div>
  );
}
