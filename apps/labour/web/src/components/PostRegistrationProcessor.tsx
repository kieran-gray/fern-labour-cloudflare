import { useCallback, useEffect, useRef, useState } from 'react';
import { AppMode, useLabourSession } from '@base/contexts/LabourSessionContext';
import { useLabourClient, usePlanLabour } from '@base/hooks';
import { useGuestPlanStorage } from '@base/hooks/useGuestPlanStorage';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader } from '@mantine/core';
import classes from './PostRegistrationProcessor.module.css';

interface PostRegistrationProcessorProps {
  children: React.ReactNode;
}

type ProcessingState = 'idle' | 'processing' | 'error' | 'done';

export function PostRegistrationProcessor({ children }: PostRegistrationProcessorProps) {
  const [, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const guestStorage = useGuestPlanStorage();
  const { setMode, setLabourId } = useLabourSession();
  const client = useLabourClient();
  const mutation = usePlanLabour(client);

  const [state, setState] = useState<ProcessingState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const processingRef = useRef(false);

  const pendingPlan = guestStorage.getPendingPlan();
  const selectedMode = guestStorage.getSelectedMode();
  const hasPendingGuestData = pendingPlan !== null || selectedMode !== null;

  const processGuestData = useCallback(async () => {
    if (processingRef.current) {
      return;
    }
    processingRef.current = true;

    setState('processing');

    try {
      if (selectedMode === AppMode.Birth && pendingPlan) {
        const result = await mutation.mutateAsync({
          firstLabour: pendingPlan.firstLabour,
          dueDate: new Date(pendingPlan.dueDate),
          labourName: pendingPlan.labourName,
        });

        setMode(AppMode.Birth);
        setLabourId(result.labour_id);
        guestStorage.clearGuestData();
        setState('done');

        setSearchParams({}, { replace: true });
        navigate('/?tab=details', { replace: true });
        return;
      }

      if (selectedMode === AppMode.Subscriber) {
        setMode(AppMode.Subscriber);
        guestStorage.clearGuestData();
        setState('done');

        setSearchParams({}, { replace: true });
        return;
      }

      setState('done');
      setSearchParams({}, { replace: true });
    } catch (error) {
      setState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to set up your plan');
      processingRef.current = false;
    }
  }, [
    selectedMode,
    pendingPlan,
    mutation,
    setMode,
    setLabourId,
    guestStorage,
    setSearchParams,
    navigate,
  ]);

  const handleRetry = useCallback(() => {
    processingRef.current = false;
    setErrorMessage(null);
    processGuestData();
  }, [processGuestData]);

  const handleSkip = useCallback(() => {
    guestStorage.clearGuestData();
    setState('done');
    setSearchParams({}, { replace: true });
  }, [guestStorage, setSearchParams]);

  useEffect(() => {
    if (hasPendingGuestData && state === 'idle') {
      processGuestData();
    }
  }, [hasPendingGuestData, state, processGuestData]);

  if (state === 'processing') {
    return (
      <div className={classes.container}>
        <div className={classes.card}>
          <Loader size="lg" color="pink" />
          <h2 className={classes.title}>Setting up your plan...</h2>
          <p className={classes.subtitle}>This will only take a moment.</p>
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className={classes.container}>
        <div className={classes.card}>
          <div className={classes.errorIcon}>
            <IconAlertCircle size={48} />
          </div>
          <h2 className={classes.title}>Something went wrong</h2>
          <p className={classes.subtitle}>{errorMessage || 'Failed to set up your plan.'}</p>
          <div className={classes.actions}>
            <button type="button" className={classes.retryButton} onClick={handleRetry}>
              <IconRefresh size={18} />
              Try Again
            </button>
            <button type="button" className={classes.skipButton} onClick={handleSkip}>
              Skip for now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
