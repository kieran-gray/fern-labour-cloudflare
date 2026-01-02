import { Title } from '@mantine/core';
import classes from './ResponsiveTitle.module.css';

interface ResponsiveTitleProps {
  title: string;
}

export function ResponsiveTitle({ title }: ResponsiveTitleProps) {
  return (
    <>
      <Title order={4} hiddenFrom="xs" className={classes.title}>
        {title}
      </Title>
      <Title order={3} hiddenFrom="sm" visibleFrom="xs" className={classes.title}>
        {title}
      </Title>
      <Title order={2} visibleFrom="sm" className={classes.title}>
        {title}
      </Title>
    </>
  );
}
