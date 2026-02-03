import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { TransitionStatusProvider } from './TransitionStatusContext';
import classes from './TabTransition.module.css';

interface TabTransitionProps {
  activeTab: string;
  renderTab: (tab: string) => React.ReactNode;
  direction: 'left' | 'right' | null;
  className?: string;
  style?: React.CSSProperties;
  onTransitionEnd?: () => void;
}

const ANIMATION_DURATION = 0.4;
const SLIDE_DISTANCE = 20;

const easeOutExpo = [0.16, 1, 0.3, 1] as const;

type Direction = 'left' | 'right' | null;

const variants = {
  initial: (dir: Direction) => ({
    opacity: 0,
    x: dir === 'right' ? SLIDE_DISTANCE : dir === 'left' ? -SLIDE_DISTANCE : 0,
  }),
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: (dir: Direction) => ({
    opacity: 0,
    x: dir === 'right' ? -SLIDE_DISTANCE : dir === 'left' ? SLIDE_DISTANCE : 0,
  }),
};

export const TabTransition = ({
  activeTab,
  renderTab,
  direction,
  className,
  style,
  onTransitionEnd,
}: TabTransitionProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const containerClassName = [classes.container, className].filter(Boolean).join(' ');

  return (
    <div className={containerClassName} style={style}>
      <TransitionStatusProvider value={isAnimating}>
        <AnimatePresence
          mode="wait"
          custom={direction}
          initial={false}
          onExitComplete={() => {
            setIsAnimating(false);
            onTransitionEnd?.();
          }}
        >
          <motion.div
            key={activeTab}
            className={classes.panel}
            custom={direction}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{
              duration: ANIMATION_DURATION * 0.5,
              ease: easeOutExpo,
            }}
            onAnimationStart={() => setIsAnimating(true)}
          >
            {renderTab(activeTab)}
          </motion.div>
        </AnimatePresence>
      </TransitionStatusProvider>
    </div>
  );
};
