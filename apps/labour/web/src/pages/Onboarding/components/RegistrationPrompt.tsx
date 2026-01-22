import { useMemo } from 'react';
import { AppMode } from '@base/contexts/LabourSessionContext';
import { useGuestPlanStorage } from '@base/hooks/useGuestPlanStorage';
import { useClerk } from '@clerk/clerk-react';
import {
  IconArrowLeft,
  IconBabyCarriage,
  IconCalendar,
  IconHeart,
  IconLogin,
  IconSparkles,
  IconStethoscope,
  IconUserPlus,
} from '@tabler/icons-react';
import { ThemeIcon } from '@mantine/core';
import classes from './RegistrationPrompt.module.css';
import baseClasses from '@styles/base.module.css';

interface RegistrationPromptProps {
  mode: AppMode | null;
  onBack: () => void;
}

export function RegistrationPrompt({ mode, onBack }: RegistrationPromptProps) {
  const { redirectToSignUp, redirectToSignIn } = useClerk();
  const guestStorage = useGuestPlanStorage();
  const pendingPlan = guestStorage.getPendingPlan();

  const formatDate = useMemo(() => {
    if (!pendingPlan) {
      return null;
    }
    return new Date(pendingPlan.dueDate).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [pendingPlan]);

  const isBirthMode = mode === AppMode.Birth;

  const handleSignUp = () => {
    redirectToSignUp({
      signUpFallbackRedirectUrl: '/?from=onboarding',
    });
  };

  const handleSignIn = () => {
    redirectToSignIn({
      signInFallbackRedirectUrl: '/?from=onboarding',
    });
  };

  return (
    <div className={baseClasses.flexPageColumn}>
      <div className={baseClasses.card}>
        <div className={classes.container}>
          <header className={classes.header}>
            <div className={classes.headerDecoration} />
            <ThemeIcon
              className={classes.headerIcon}
              size={64}
              radius="xl"
              variant="light"
              color={isBirthMode ? 'pink' : 'blue'}
            >
              {isBirthMode ? <IconBabyCarriage size={32} /> : <IconHeart size={32} />}
            </ThemeIcon>
            <h1 className={classes.title}>
              {isBirthMode ? (
                <>
                  Your plan is <span className={classes.titleAccent}>ready!</span>
                </>
              ) : (
                <>
                  Ready to <span className={classes.titleAccent}>support?</span>
                </>
              )}
            </h1>
            <p className={classes.subtitle}>
              {isBirthMode
                ? 'Create an account to start tracking your labour journey and share updates with loved ones.'
                : 'Create an account to follow and support someone through their labour journey.'}
            </p>
          </header>

          {pendingPlan && isBirthMode && (
            <div className={classes.summaryCard}>
              <h3 className={classes.summaryTitle}>
                <IconSparkles size={18} />
                Your Labour Plan
              </h3>
              <div className={classes.summaryList}>
                <div className={classes.summaryItem}>
                  <span className={classes.summaryIcon}>
                    <IconCalendar size={16} />
                  </span>
                  <span className={classes.summaryLabel}>Due date</span>
                  <span className={classes.summaryValue}>{formatDate}</span>
                </div>
                <div className={classes.summaryItem}>
                  <span className={classes.summaryIcon}>
                    <IconStethoscope size={16} />
                  </span>
                  <span className={classes.summaryLabel}>First labour</span>
                  <span className={classes.summaryValue}>
                    {pendingPlan.firstLabour ? 'Yes' : 'No'}
                  </span>
                </div>
                {pendingPlan.labourName && (
                  <div className={classes.summaryItem}>
                    <span className={classes.summaryIcon}>
                      <IconSparkles size={16} />
                    </span>
                    <span className={classes.summaryLabel}>Name</span>
                    <span className={classes.summaryValue}>{pendingPlan.labourName}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={classes.authActions}>
            <button type="button" className={classes.signUpButton} onClick={handleSignUp}>
              <IconUserPlus size={20} />
              Create Account
            </button>
            <button type="button" className={classes.signInButton} onClick={handleSignIn}>
              <IconLogin size={18} />
              Already have an account? Sign In
            </button>
          </div>

          <div className={classes.navigation}>
            <button type="button" className={classes.backButton} onClick={onBack}>
              <IconArrowLeft size={16} />
              {isBirthMode ? 'Edit Plan' : 'Back'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
