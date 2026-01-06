import { IconAlertTriangle, IconHome } from '@tabler/icons-react';
import classes from './ErrorContainer.module.css';
import baseClasses from '@styles/base.module.css';

export function ErrorContainer({ message }: { message: string }) {
  return (
    <div className={classes.wrapper}>
      <div className={`${baseClasses.card} ${classes.container}`}>
        <header className={classes.header}>
          <div className={classes.headerDecoration} />
          <div className={classes.iconContainer}>
            <div className={classes.errorIcon}>
              <IconAlertTriangle size={32} stroke={2} />
            </div>
          </div>
          <p className={classes.greeting}>Oops</p>
          <h1 className={classes.title}>
            <span className={classes.titleAccent}>Something went wrong</span>
          </h1>
        </header>

        <div className={classes.messageCard}>
          <p className={classes.messageText}>{message}</p>
        </div>

        <div className={classes.actionContainer}>
          <a href="/" className={classes.homeButton}>
            <IconHome size={18} />
            Go to Home
          </a>
        </div>
      </div>
    </div>
  );
}
