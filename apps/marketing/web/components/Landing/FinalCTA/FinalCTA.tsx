import Link from 'next/link';
import { IconArrowRight } from '@tabler/icons-react';
import { motion } from 'motion/react';
import { Box, Button, Container, Stack, Text, Title } from '@mantine/core';
import CSSParticles from './CSSParticles';

type FinalCTAProps = {
  title: string;
  description: string;
  cta: string;
  subtitle?: string;
};

export const FinalCTA = ({ title, description, cta, subtitle }: FinalCTAProps) => {
  return (
    <Box bg="var(--mantine-color-pink-3)" py={80} pos="relative" style={{ overflow: 'hidden' }}>
      {/* Particles cover entire section */}
      <Box pos="absolute" top={0} left={0} w="100%" h="100%" style={{ zIndex: 0 }}>
        <CSSParticles id="cta-particles" color="#ffffff" opacity={0.1} />
      </Box>

      {/* Content overlay */}
      <Container size="xl" pos="relative" style={{ zIndex: 10 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          viewport={{ once: true }}
        >
          <Stack align="center" gap="xl" ta="center" maw={600} mx="auto">
            <Title
              order={1}
              size="h1"
              c="white"
              style={{
                textWrap: 'balance',
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
              }}
            >
              {title}
            </Title>

            <Text
              size="xl"
              c="white"
              style={{
                lineHeight: 1.5,
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
              }}
            >
              {description}
            </Text>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Link href="https://track.fernlabour.com" target="_blank">
                <Button
                  size="xl"
                  radius="xl"
                  variant="white"
                  c="pink.6"
                  rightSection={<IconArrowRight size={18} />}
                  px="xl"
                  fw={600}
                  style={{
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)',
                    border: '2px solid var(--mantine-color-white)',
                  }}
                >
                  {cta}
                </Button>
              </Link>
            </motion.div>

            {subtitle && (
              <Text
                size="sm"
                c="pink.0"
                style={{
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                }}
              >
                {subtitle}
              </Text>
            )}
          </Stack>
        </motion.div>
      </Container>
    </Box>
  );
};
