import { IconAmbulance, IconBackpack, IconPhone } from '@tabler/icons-react';
import { motion } from 'motion/react';
import { Alert, Container, Text, Title } from '@mantine/core';
import classes from './AlertsFeature.module.css';

const alerts = [
  {
    color: 'orange',
    title: 'Prepare to go to the hospital',
    icon: IconBackpack,
    text: 'Your contractions are becoming more consistent. Stay relaxed and keep monitoring.',
  },
  {
    color: 'orange',
    title: 'Time to go to the hospital',
    icon: IconAmbulance,
    text: 'Your contractions are regular and strong. Labour is well underway.',
  },
  {
    color: 'red',
    title: 'Time to call your midwife',
    icon: IconPhone,
    text: 'You have had 6 or more contractions in a 10 minute period.',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const alertVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

export function AlertsFeature() {
  return (
    <div className={classes.root}>
      <Container size="lg" className={classes.inner}>
        <motion.div
          className={classes.visual}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
        >
          {alerts.map((alert) => (
            <motion.div key={alert.title} variants={alertVariants}>
              <Alert
                variant="light"
                color={alert.color}
                radius="md"
                title={alert.title}
                icon={<alert.icon />}
                className={classes.mockAlert}
              >
                <Text ta="start" fz="sm" c="gray.7">
                  {alert.text}
                </Text>
              </Alert>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          className={classes.content}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          viewport={{ once: true, margin: '-10%' }}
        >
          <Title className={classes.title}>Guidance when you need it</Title>
          <Text className={classes.description}>
            We watch your pattern quietly. When the time comes, we'll let you know: prepare, leave
            for the hospital, or call your midwife.
          </Text>
        </motion.div>
      </Container>
    </div>
  );
}
