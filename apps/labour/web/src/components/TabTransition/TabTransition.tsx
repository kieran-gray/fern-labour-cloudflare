import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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

const ANIMATION_DURATION_MS = 300;

const getAnimationClass = (
  type: 'enter' | 'exit',
  direction: 'left' | 'right' | null
): string | undefined => {
  if (direction === 'right') {
    return type === 'enter' ? classes.slideInRight : classes.slideOutLeft;
  }
  return type === 'enter' ? classes.slideInLeft : classes.slideOutRight;
};

export const TabTransition = ({
  activeTab,
  renderTab,
  direction,
  className,
  style,
  onTransitionEnd,
}: TabTransitionProps) => {
  const [displayTab, setDisplayTab] = useState(activeTab);
  const [previousTab, setPreviousTab] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationDirection = useRef(direction);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number | 'auto'>('auto');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onTransitionEndRef = useRef(onTransitionEnd);
  useEffect(() => {
    onTransitionEndRef.current = onTransitionEnd;
  }, [onTransitionEnd]);

  useEffect(() => {
    if (activeTab !== displayTab) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (containerRef.current) {
        setContainerHeight(containerRef.current.offsetHeight);
      }

      setPreviousTab(displayTab);
      setDisplayTab(activeTab);
      setIsAnimating(true);
      animationDirection.current = direction;

      timeoutRef.current = setTimeout(() => {
        setPreviousTab(null);
        setIsAnimating(false);
        setContainerHeight('auto');
        onTransitionEndRef.current?.();
        timeoutRef.current = null;
      }, ANIMATION_DURATION_MS);
    }
  }, [activeTab, displayTab, direction]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useLayoutEffect(() => {
    if (isAnimating && activeTabRef.current) {
      setContainerHeight(activeTabRef.current.offsetHeight);
    }
  }, [isAnimating, displayTab]);

  const containerClassName = [classes.container, isAnimating && classes.animating, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={containerRef}
      className={containerClassName}
      style={{
        ...style,
        height: containerHeight === 'auto' ? 'auto' : `${containerHeight}px`,
      }}
    >
      <TransitionStatusProvider value={isAnimating}>
        {isAnimating && previousTab && (
          <div
            key={`prev-${previousTab}`}
            className={`${classes.panel} ${getAnimationClass('exit', animationDirection.current)}`}
            aria-hidden="true"
          >
            {renderTab(previousTab)}
          </div>
        )}

        <div
          ref={activeTabRef}
          key={`curr-${displayTab}`}
          className={`${classes.panel} ${isAnimating ? getAnimationClass('enter', animationDirection.current) : ''}`}
        >
          {renderTab(displayTab)}
        </div>
      </TransitionStatusProvider>
    </div>
  );
};
