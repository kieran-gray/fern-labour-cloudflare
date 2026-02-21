import { useEffect, useRef, useState } from 'react';
import { AppMode, useLabourSession } from '@base/contexts';
import { useLabourClient, useRequestAccess } from '@base/hooks';
import { useUser } from '@clerk/clerk-react';
import { AppShell } from '@components/AppShell';
import {
  IconAlertCircle,
  IconCheck,
  IconClock,
  IconHeart,
  IconHome,
  IconLoader2,
} from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import classes from './Page.module.css';
import baseClasses from '@styles/base.module.css';

type Status =
  | 'pending'
  | 'success'
  | 'error'
  | 'missing-name'
  | 'already-subscribed'
  | 'request-pending';

export const SubscribePage: React.FC = () => {
  const { id, token } = useParams();
  const { user, isLoaded } = useUser();
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
    if (!isLoaded || hasTriggered.current) {
      return;
    }

    if (!user?.fullName) {
      setStatus('missing-name');
      return;
    }

    hasTriggered.current = true;

    const subscribe = async () => {
      try {
        await mutateAsync({ labourId, token, subscriberName: user.fullName! });
        setMode(AppMode.Subscriber);
        setStatus('success');
      } catch (err) {
        const message = err instanceof Error ? err.message : '';
        if (message.includes('Already subscribed')) {
          setMode(AppMode.Subscriber);
          setStatus('already-subscribed');
        } else if (message.includes('Request pending')) {
          setStatus('request-pending');
        } else {
          setStatus('error');
        }
      }
    };

    subscribe();
  }, [isLoaded, user, labourId, token, mutateAsync, setMode]);

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <AppShell>
      <div className={baseClasses.flexPageColumn}>
        <div className={baseClasses.card}>
          <div className={classes.container}>
            <header className={classes.header}>
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

              {status === 'already-subscribed' && (
                <>
                  <div className={classes.iconContainer}>
                    <div className={classes.successIcon}>
                      <IconHeart size={32} stroke={2} />
                    </div>
                  </div>
                  <p className={classes.greeting}>Welcome back</p>
                  <h1 className={classes.title}>
                    <span className={classes.titleAccent}>Already subscribed</span>
                  </h1>
                </>
              )}

              {status === 'request-pending' && (
                <>
                  <div className={classes.iconContainer}>
                    <div className={classes.infoIcon}>
                      <IconClock size={32} stroke={2} />
                    </div>
                  </div>
                  <p className={classes.greeting}>Hang tight</p>
                  <h1 className={classes.title}>
                    <span className={classes.titleAccent}>Request already sent</span>
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

              {status === 'missing-name' && (
                <>
                  <div className={classes.iconContainer}>
                    <div className={classes.errorIcon}>
                      <IconAlertCircle size={32} stroke={2} />
                    </div>
                  </div>
                  <p className={classes.greeting}>One more step</p>
                  <h1 className={classes.title}>
                    <span className={classes.titleAccent}>Name required</span>
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

            {status === 'already-subscribed' && (
              <div className={classes.messageCard}>
                <p className={classes.messageText}>You're already part of this labour circle.</p>
                <p className={classes.messageText}>Head home to view the latest updates.</p>
              </div>
            )}

            {status === 'request-pending' && (
              <div className={classes.messageCard}>
                <p className={classes.messageText}>
                  Your request to join has already been sent and is waiting for approval.
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

            {status === 'missing-name' && (
              <div className={classes.messageCard}>
                <p className={classes.messageText}>
                  Please update your profile to include your full name before subscribing.
                </p>
                <p className={classes.messageText}>
                  This helps the person you're supporting know who you are.
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
