import Link from 'next/link';
import { motion } from 'motion/react';
import { Button, Container, Group, Text, Title } from '@mantine/core';
import CSSParticles from '../../CSSParticles/CSSParticles';
import { SectionSeparator } from '../../SectionSeparator/SectionSeparator';
import classes from './Hero.module.css';

export function Hero() {
  return (
    <div className={classes.heroRoot}>
      <div className={classes.particlesWrapper}>
        <CSSParticles id="hero-particles" color="#ff7964" opacity={0.15} />
      </div>

      <Container size="lg" className={classes.inner}>
        <div className={classes.content}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <Title className={classes.title}>
              Be present for your birth.
              <br />
              <span className={classes.highlight}>We'll keep your people close.</span>
            </Title>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          >
            <Text className={classes.description}>
              Focus on your labour, not your phone. We'll update your chosen circle so you don't
              have to.
            </Text>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.4, ease: 'easeOut' }}
          >
            <Group justify="center" gap="md">
              <Link
                href={
                  process.env.NEXT_PUBLIC_APP_LABOUR_WEB_URL
                    ? `${process.env.NEXT_PUBLIC_APP_LABOUR_WEB_URL}/get-started`
                    : 'https://app.fernlabour.com/get-started'
                }
                target="_blank"
              >
                <Button size="lg" radius="xl" color="pink">
                  Create your labour circle
                </Button>
              </Link>
            </Group>
          </motion.div>
        </div>
      </Container>

      <SectionSeparator position="bottom" color="#fdfaf8" />
    </div>
  );
}
