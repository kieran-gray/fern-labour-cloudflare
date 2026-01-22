import { IconAlertCircle, IconHome } from '@tabler/icons-react';
import classes from './ErrorContainer.module.css';

interface ErrorContainerProps {
  message: string;
}

export function ErrorContainer({ message }: ErrorContainerProps) {
  return (
    <div className={classes.container}>
      <div className={classes.card}>
        <div className={classes.errorIcon}>
          <IconAlertCircle size={48} />
        </div>
        <h2 className={classes.title}>Something went wrong</h2>
        <p className={classes.subtitle}>{message}</p>
        <div className={classes.actions}>
          <a href="/" className={classes.homeButton}>
            <IconHome size={18} />
            Go to Home
          </a>
        </div>
      </div>
    </div>
  );
}
