import { useEffect, useRef, type ReactNode } from 'react';
import { useNetworkState } from '@base/offline/sync/networkDetector';
import { RedirectToSignIn, useAuth, useUser } from '@clerk/clerk-react';
import { PageSkeleton } from './Cards/CardSkeleton';

interface ProtectedAppProps {
  children: ReactNode;
}

export const ProtectedApp: React.FC<ProtectedAppProps> = (props) => {
  const { children } = props;

  const { isOnline } = useNetworkState();
  const { isLoaded: isAuthLoaded, isSignedIn, getToken } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const wasOnlineRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (wasOnlineRef.current === null) {
      wasOnlineRef.current = isOnline;
      return;
    }

    const cameOnline = wasOnlineRef.current === false && isOnline === true;
    wasOnlineRef.current = isOnline;

    if (!cameOnline) {
      return;
    }

    if (user || isSignedIn) {
      getToken({ skipCache: true }).catch(() => {});
    }
  }, [isOnline, user, isSignedIn, getToken]);

  if (!isOnline && user) {
    return children;
  }

  if (!isAuthLoaded || !isUserLoaded) {
    return <PageSkeleton preAuth />;
  }

  if (isSignedIn) {
    return children;
  }

  return <RedirectToSignIn />;
};
