import classes from './ErrorContainer.module.css';
import baseClasses from '@styles/base.module.css';

export function ErrorContainer({ message }: { message: string }) {
  return (
    <div className={classes.container}>
      <div className={baseClasses.root}>
        <div className={baseClasses.body}>
          <div style={{ fontSize: '20px', fontWeight: '700' }}>Error :(</div>
          <div className={classes.messageContainer}>
            <div style={{ fontWeight: '500' }}>{message}</div>
          </div>
          <div className={classes.controls}>
            <a href="/" className={classes.button}>
              Go Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
