import { useEffect } from 'react';
import { AppShell } from '@base/components/AppShell';
import { appRoutes } from '@base/lib/constants';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { BirthPlanWizard } from './components/BirthPlanWizard';
import { useBirthPlanStorage } from './hooks/useBirthPlanStorage';
import baseClasses from '@styles/base.module.css';

interface BirthPlanPageProps {
  authenticated?: boolean;
}

export function BirthPlanPage({ authenticated = false }: BirthPlanPageProps) {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const { data, updateField } = useBirthPlanStorage();

  useEffect(() => {
    if (!authenticated && authLoaded && isSignedIn) {
      navigate(appRoutes.birthPlanAuth, { replace: true });
    }
  }, [authenticated, authLoaded, isSignedIn, navigate]);

  useEffect(() => {
    if (userLoaded && user && !data.fullName) {
      const fullName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim();
      if (fullName) {
        updateField('fullName', fullName);
      }
    }
  }, [userLoaded, user, data.fullName, updateField]);

  return (
    <AppShell preAuth={!authenticated}>
      <div className={baseClasses.flexPageColumn}>
        <div className={baseClasses.card}>
          <BirthPlanWizard />
        </div>
      </div>
    </AppShell>
  );
}
