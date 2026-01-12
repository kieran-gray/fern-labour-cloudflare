import { Button, Container, Text, Title } from '@mantine/core';
import classes from './StartJourney.module.css';

export function StartJourney() {
  return (
    <div className={classes.root}>
      <Container size="lg">
        <Title className={classes.title}>Start Your Journey</Title>
        <Text className={classes.description}>
          Whether you're tracking your own labour or following along with someone you love — welcome
          to Fern Labour.
        </Text>

        <div className={classes.buttonGroup}>
          <Button size="xl" radius="xl" color="pink">
            Start Tracking
          </Button>
          <Button size="xl" radius="xl" variant="default">
            Join a Journey
          </Button>
        </div>

        <Text className={classes.subText}>
          Have an invite code?{' '}
          <a href="#" className={classes.link}>
            Enter it here
          </a>{' '}
          or scan a QR code.
        </Text>
      </Container>
    </div>
  );
}
