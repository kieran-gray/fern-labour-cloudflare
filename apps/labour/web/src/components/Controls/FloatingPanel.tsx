import { useState } from 'react';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { ActionIcon } from '@mantine/core';
import classes from './FloatingPanel.module.css';

interface FloatingPanelProps {
  /** Whether the panel should be visible */
  visible: boolean;
  /** Content to render inside the panel */
  children: React.ReactNode;
  /** Callback when panel is toggled */
  onToggle?: (isExpanded: boolean) => void;
  /** Additional class name for the container */
  className?: string;
}

/**
 * A collapsible floating panel that appears at the bottom of the screen.
 * Used for floating controls like contraction tracking and labour updates.
 */
export function FloatingPanel({ visible, children, onToggle, className }: FloatingPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!visible) {
    return null;
  }

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onToggle?.(newExpanded);
  };

  return (
    <div
      className={`${classes.floatingPanel} ${!isExpanded ? classes.collapsed : ''} ${className || ''}`}
    >
      <div className={classes.header}>
        <ActionIcon
          variant="subtle"
          size="sm"
          onClick={handleToggle}
          className={classes.toggleButton}
        >
          {isExpanded ? <IconChevronDown size={16} /> : <IconChevronUp size={16} />}
        </ActionIcon>
      </div>

      {isExpanded && <div className={classes.content}>{children}</div>}
    </div>
  );
}
