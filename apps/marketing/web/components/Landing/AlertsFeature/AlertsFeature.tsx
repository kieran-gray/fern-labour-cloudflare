import { IconAmbulance, IconBackpack, IconPhone } from '@tabler/icons-react';
import { motion } from 'motion/react';
import { Alert, Container, Text, Title } from '@mantine/core';
import { fadeUp, scaleUp, staggerContainer } from '@/lib/motion';
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

export function AlertsFeature() {
  return (
    <div className={classes.root}>
      <Container size="lg" className={classes.inner}>
        <motion.div
          className={classes.visual}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
        >
          {alerts.map((alert) => (
            <motion.div key={alert.title} variants={scaleUp}>
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
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
        >
          <Title className={classes.title}>Guidance when you need it</Title>
          <Text className={classes.description}>
            We watch your pattern quietly. We'll suggest when it might be time to prepare, head in,
            or reach out.
          </Text>
        </motion.div>
      </Container>
    </div>
  );
}
