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

export const TabTransition = ({
  activeTab,
  renderTab,
  direction,
  className,
  style,
  onTransitionEnd,
}: TabTransitionProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const getInitialX = () => {
    if (direction === 'right') {
      return SLIDE_DISTANCE;
    }
    if (direction === 'left') {
      return -SLIDE_DISTANCE;
    }
    return 0;
  };

  const getExitX = () => {
    if (direction === 'right') {
      return -SLIDE_DISTANCE;
    }
    if (direction === 'left') {
      return SLIDE_DISTANCE;
    }
    return 0;
  };

  const containerClassName = [classes.container, className].filter(Boolean).join(' ');

  return (
    <div className={containerClassName} style={style}>
      <TransitionStatusProvider value={isAnimating}>
        <AnimatePresence
          mode="wait"
          initial={false}
          onExitComplete={() => {
            setIsAnimating(false);
            onTransitionEnd?.();
          }}
        >
          <motion.div
            key={activeTab}
            className={classes.panel}
            initial={{ opacity: 1, x: getInitialX() }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: getExitX() }}
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
