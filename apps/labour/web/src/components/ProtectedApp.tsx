import { useEffect, useRef, type ReactNode } from 'react';
import { useClerkUser } from '@base/hooks/useClerkUser';
import { useNetworkState } from '@base/offline/sync/networkDetector';
import { RedirectToSignIn, useAuth } from '@clerk/clerk-react';
import { PageLoading } from './PageLoading/PageLoading';

interface ProtectedAppProps {
  children: ReactNode;
}

export const ProtectedApp: React.FC<ProtectedAppProps> = (props) => {
  const { children } = props;

  const { isOnline } = useNetworkState();
  const { isLoaded: isAuthLoaded, isSignedIn, getToken } = useAuth();
  const { user, isLoaded: isUserLoaded } = useClerkUser();
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
    return <PageLoading />;
  }

  if (isSignedIn) {
    return children;
  }

  return <RedirectToSignIn />;
};
