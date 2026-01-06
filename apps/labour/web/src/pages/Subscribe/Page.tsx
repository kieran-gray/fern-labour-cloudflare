import { useEffect, useRef, useState } from 'react';
import { AppMode, useLabourSession } from '@base/contexts';
import { useLabourClient, useRequestAccess } from '@base/hooks';
import { AppShell } from '@components/AppShell';
import { IconAlertCircle, IconCheck, IconHome, IconLoader2 } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import classes from './Page.module.css';
import baseClasses from '@styles/base.module.css';

type Status = 'pending' | 'success' | 'error';

export const SubscribePage: React.FC = () => {
  const { id, token } = useParams();
  const navigate = useNavigate();
  const { setMode } = useLabourSession();
  const hasTriggered = useRef(false);
  const [status, setStatus] = useState<Status>('pending');

  if (!id || !token) {
    throw new Error('id and token are required');
  }

  const labourId = id;
  const client = useLabourClient();
  const { mutateAsync } = useRequestAccess(client);

  useEffect(() => {
    if (hasTriggered.current) {
      return;
    }
    hasTriggered.current = true;

    const subscribe = async () => {
      try {
        await mutateAsync({ labourId, token });
        setMode(AppMode.Subscriber);
        setStatus('success');
      } catch {
        setStatus('error');
      }
    };

    subscribe();
  }, [labourId, token, mutateAsync, setMode]);

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <AppShell>
      <div className={baseClasses.flexPageColumn}>
        <div className={baseClasses.card}>
          <div className={classes.container}>
            <header className={classes.header}>
              <div className={classes.headerDecoration} />

              {status === 'pending' && (
                <>
                  <div className={classes.iconContainer}>
                    <IconLoader2 size={48} className={classes.loadingIcon} />
                  </div>
                  <p className={classes.greeting}>Please wait</p>
                  <h1 className={classes.title}>
                    <span className={classes.titleAccent}>Subscribing...</span>
                  </h1>
                  <p className={classes.subtitle}>
                    We're setting up your subscription to this labour journey.
                  </p>
                </>
              )}

              {status === 'success' && (
                <>
                  <div className={classes.iconContainer}>
                    <div className={classes.successIcon}>
                      <IconCheck size={32} stroke={2.5} />
                    </div>
                  </div>
                  <p className={classes.greeting}>Request Sent</p>
                  <h1 className={classes.title}>
                    <span className={classes.titleAccent}>Almost there!</span>
                  </h1>
                </>
              )}

              {status === 'error' && (
                <>
                  <div className={classes.iconContainer}>
                    <div className={classes.errorIcon}>
                      <IconAlertCircle size={32} stroke={2} />
                    </div>
                  </div>
                  <p className={classes.greeting}>Oops</p>
                  <h1 className={classes.title}>
                    <span className={classes.titleAccent}>Something went wrong</span>
                  </h1>
                </>
              )}
            </header>

            {status === 'success' && (
              <div className={classes.messageCard}>
                <p className={classes.messageText}>
                  Your request to join a labour circle has been sent.
                </p>
                <p className={classes.messageText}>
                  They will need to approve your request before you can access their labour.
                </p>
                <p className={classes.messageText}>
                  You'll get an email as soon as you're approved, thanks for your patience!
                </p>
              </div>
            )}

            {status === 'error' && (
              <div className={classes.messageCard}>
                <p className={classes.messageText}>
                  We couldn't process your subscription request. The link may have expired.
                </p>
                <p className={classes.messageText}>
                  Please ask the person who shared this link with you to send a new one.
                </p>
              </div>
            )}

            {status !== 'pending' && (
              <div className={classes.actionContainer}>
                <button type="button" className={classes.homeButton} onClick={handleGoHome}>
                  <IconHome size={18} />
                  Go to Home
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
};
