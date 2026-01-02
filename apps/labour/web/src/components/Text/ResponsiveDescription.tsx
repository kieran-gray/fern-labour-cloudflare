import { Text } from '@mantine/core';
import classes from '@styles/base.module.css';

interface ResponsiveDescriptionProps {
  description: React.ReactNode;
  marginTop: number;
}

export function ResponsiveDescription({ description, marginTop }: ResponsiveDescriptionProps) {
  return (
    <div style={{ marginTop }}>
      <Text size="sm" hiddenFrom="sm" className={classes.description}>
        {description}
      </Text>
      <Text size="md" visibleFrom="sm" className={classes.description}>
        {description}
      </Text>
    </div>
  );
}
