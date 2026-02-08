import { Variants } from 'motion/react';

export const BRAND_EASING = [0.7, 0, 0.3, 1] as const;

export const FADE_UP_Y = 24;

export const LATERAL_X = 20;

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: FADE_UP_Y },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: BRAND_EASING,
    },
  },
};

export const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: FADE_UP_Y },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: BRAND_EASING,
    },
  },
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: -LATERAL_X },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: BRAND_EASING,
    },
  },
};

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: LATERAL_X },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: BRAND_EASING,
    },
  },
};

export const iconPop: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: 'backOut',
    },
  },
};
