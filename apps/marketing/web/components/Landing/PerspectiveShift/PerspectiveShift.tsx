import { motion } from 'motion/react';
import { Container, Text, Title } from '@mantine/core';
import { fadeUp } from '@/lib/motion';
import classes from './PerspectiveShift.module.css';

export function PerspectiveShift() {
  return (
    <>
      <section className="curved" />
      <div className={classes.root}>
        <Container size="md" className={classes.inner}>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-10%' }}
          >
            <Text className={classes.label}>Meanwhile...</Text>
            <Title className={classes.title}>Someone who loves you is waiting to hear</Title>
            <Text className={classes.description}>
              Your mum. Your sister. Your best friend. They can't be there with you, but they want
              to feel close. Now they can follow along without ever interrupting your moment.
            </Text>
          </motion.div>
        </Container>
      </div>
    </>
  );
}
