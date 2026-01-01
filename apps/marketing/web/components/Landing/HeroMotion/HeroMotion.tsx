import Link from 'next/link';
import { IconArrowRight } from '@tabler/icons-react';
import { motion } from 'motion/react';
import { Badge, Box, Button, Container, ContainerProps, Flex, Stack, Text } from '@mantine/core';
import CSSParticles from '../FinalCTA/CSSParticles';
import { JumboTitle } from '../JumboTitle/JumboTitle';
import classes from './HeroMotion.module.css';

type Hero03Props = ContainerProps & {
  title?: string;
  subtitle?: string;
  description?: string;
  cta?: string;
};

export const Hero03 = ({ title, subtitle, description, cta, ...containerProps }: Hero03Props) => (
  <Container
    pos="relative"
    h="90vh"
    mah={700}
    style={{ overflow: 'hidden' }}
    px="15px"
    fluid
    id="#home"
  >
    <Container component="section" h="90vh" mah={700} mx="auto" size="xl" {...containerProps}>
      <Box pos="absolute" top={0} left={0} w="100%" h="100%" style={{ zIndex: 0 }}>
        <CSSParticles id="hero-particles" color="#ff7964" opacity={0.1} />
      </Box>
      <Flex h="100%" align="center" pos="relative" justify="center">
        <Stack
          pt={{ base: 'xl', sm: 0 }}
          maw="var(--mantine-breakpoint-md)"
          align="center"
          gap="xl"
          style={{ zIndex: 1 }}
        >
          {subtitle && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <Badge variant="light" size="lg" radius="xl" c="dimmed">
                {subtitle}
              </Badge>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
          >
            <JumboTitle ta="center" order={1} fz="lg" style={{ textWrap: 'balance' }}>
              {title}
            </JumboTitle>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          >
            <Text
              ta="center"
              maw="var(--mantine-breakpoint-xs)"
              fz="xl"
              c="var(--mantine-color-gray-7)"
              style={{ textWrap: 'balance', lineHeight: 1.4 }}
            >
              {description}
            </Text>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link href="https://track.fernlabour.com" target="_blank">
              <Button
                radius="xl"
                size="xl"
                className={classes.control}
                rightSection={<IconArrowRight size={18} />}
                px="xl"
              >
                {cta || 'Start tracking free'}
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Text size="sm" c="var(--mantine-color-gray-7)" ta="center">
              Free for mothers forever • No credit card required
            </Text>
          </motion.div>
        </Stack>
      </Flex>
    </Container>
  </Container>
);
