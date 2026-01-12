import { motion } from 'motion/react';
import { Container, Text, Title } from '@mantine/core';
import classes from './PerspectiveShift.module.css';

export function PerspectiveShift() {
  return (
    <>
      <section className="curved" />
      <div className={classes.root}>
        <Container size="md" className={classes.inner}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            viewport={{ once: true, margin: '-10%' }}
          >
            <Text className={classes.label}>Meanwhile...</Text>
            <Title className={classes.title}>Someone who loves you is waiting to hear</Title>
            <Text className={classes.description}>
              Your mum. Your sister. Your best friend. They can't be there with you, but they want
              to feel close. Fern Labour gives them a way to follow along — without ever
              interrupting your moment.
            </Text>
          </motion.div>
        </Container>
      </div>
    </>
  );
}
