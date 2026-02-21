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
import { Button, Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
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
              {isBirthMode ? 'Your Labour is ready!' : 'Ready to support?'}
            </h1>
            <p className={classes.subtitle}>
              {isBirthMode
                ? 'Create an account to start tracking your labour journey and share updates with loved ones.'
                : 'Create an account to follow and support someone through their labour journey.'}
            </p>
          </header>

          {pendingPlan && isBirthMode && (
            <Paper className={classes.summaryCard} withBorder radius="lg" p="md">
              <Group className={classes.summaryTitle} gap="xs" mb="sm">
                <IconSparkles size={18} />
                <Text fw={600}>Your Labour</Text>
              </Group>

              <Stack gap={6}>
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
              </Stack>
            </Paper>
          )}

          <Stack className={classes.authActions} gap="sm">
            <Button
              type="button"
              onClick={handleSignUp}
              leftSection={<IconUserPlus size={18} />}
              radius="xl"
              size="md"
              className={classes.signUpButton}
            >
              Create Account
            </Button>

            <Button
              type="button"
              onClick={handleSignIn}
              leftSection={<IconLogin size={16} />}
              radius="xl"
              variant="default"
              size="md"
              className={classes.signInButton}
            >
              Already have an account? Sign In
            </Button>
          </Stack>

          <Group justify="center" className={classes.navigation}>
            <Button
              type="button"
              onClick={onBack}
              leftSection={<IconArrowLeft size={16} />}
              variant="subtle"
              radius="xl"
              className={classes.backButton}
            >
              {isBirthMode ? 'Edit Plan' : 'Back'}
            </Button>
          </Group>
        </div>
      </div>
    </div>
  );
}
