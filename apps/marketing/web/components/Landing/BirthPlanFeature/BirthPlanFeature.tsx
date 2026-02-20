import { IconArrowRight } from '@tabler/icons-react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Button, Container, Stack, Text, Title } from '@mantine/core';
import { fadeUp } from '@/lib/motion';
import classes from './BirthPlanFeature.module.css';

const paperVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: 'easeInOut',
      when: 'beforeChildren',
      staggerChildren: 0.1,
    },
  },
  hover: {
    y: -5,
    scale: 1.02,
    transition: { type: 'spring', stiffness: 200, damping: 25 },
  },
  tap: {
    scale: 0.98,
    y: 0,
    boxShadow: '0 5px 10px -2px rgba(0, 0, 0, 0.1)',
    transition: { type: 'spring', stiffness: 400, damping: 10 },
  },
} as const;

const itemVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1 },
} as const;

const checkVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.3, type: 'spring' },
  },
} as const;

const checkboxContainerVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 400, damping: 15 },
  },
} as const;

const lineVariants = {
  hidden: { scaleX: 0, originX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: 0.5, ease: 'easeInOut' },
  },
} as const;

interface BirthPlanFeatureProps {
  callToActionUrl?: string;
}

export function BirthPlanFeature({ callToActionUrl }: BirthPlanFeatureProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 100, damping: 20 });
  const mouseY = useSpring(y, { stiffness: 100, damping: 20 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ['4deg', '-4deg']);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ['-4deg', '4deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseXPos = e.clientX - rect.left;
    const mouseYPos = e.clientY - rect.top;

    const xPct = mouseXPos / width - 0.5;
    const yPct = mouseYPos / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

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
          <Title className={classes.title}>Create your birth plan</Title>
          <Text className={classes.description}>
            Preferences, companions, and pain relief, organised clearly and privately in minutes.
          </Text>
          <Stack align="center" gap="xs">
            <Button
              component="a"
              href={callToActionUrl || 'https://app.fernlabour.com/birth-plan'}
              size="lg"
              rightSection={<IconArrowRight size={18} />}
              variant="light"
              color="teal"
              radius="xl"
            >
              Start planning
            </Button>
            <Text c="dimmed" size="xs">
              No sign-up required
            </Text>
          </Stack>
        </motion.div>

        <motion.div
          className={classes.visual}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-10%' }}
          style={{ perspective: 1000 }}
        >
          <motion.div
            className={classes.paper}
            variants={paperVariants}
            whileHover="hover"
            whileTap="tap"
            style={{
              rotateX,
              rotateY,
              transformStyle: 'preserve-3d',
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div className={classes.header}>
              <span className={classes.brand}>Fern Labour</span>
              <div className={classes.docInfo}>
                <strong>Birth Plan</strong>
                <br />
                Sarah Jenkins
              </div>
            </div>

            <div className={classes.body}>
              <div className={classes.highlightSection}>
                <div className={classes.highlightHeading} />
                {[1, 2].map((i) => (
                  <motion.div key={`b-${i}`} className={classes.item} variants={itemVariants}>
                    <motion.div className={classes.checkbox} variants={checkboxContainerVariants}>
                      {i === 1 && <motion.div className={classes.check} variants={checkVariants} />}
                    </motion.div>
                    <motion.div
                      className={classes.line}
                      style={{ width: '70%', marginBottom: 0 }}
                      variants={lineVariants}
                    />
                  </motion.div>
                ))}
              </div>

              <div className={classes.section} style={{ marginTop: 'var(--mantine-spacing-md)' }}>
                <div className={classes.sectionHeading} />
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <motion.div key={i} className={classes.row} variants={itemVariants}>
                    <motion.div className={classes.label} variants={lineVariants} />
                    <motion.div className={classes.value} variants={lineVariants} />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </Container>
    </div>
  );
}
