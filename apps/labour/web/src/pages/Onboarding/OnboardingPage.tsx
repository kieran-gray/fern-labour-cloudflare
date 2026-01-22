import { useCallback, useState } from 'react';
import { AppShell } from '@base/components/AppShell';
import { AppMode } from '@base/contexts/LabourSessionContext';
import { useGuestPlanStorage } from '@base/hooks/useGuestPlanStorage';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { GuestModeSelect } from './components/GuestModeSelect';
import { GuestPlan } from './components/GuestPlan';
import { RegistrationPrompt } from './components/RegistrationPrompt';

export type OnboardingStep = 'mode-select' | 'plan' | 'registration';

export function OnboardingPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const guestStorage = useGuestPlanStorage();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<OnboardingStep>(() => {
    const savedMode = guestStorage.getSelectedMode();
    const savedPlan = guestStorage.getPendingPlan();

    if (savedPlan) {
      return 'registration';
    }
    if (savedMode === AppMode.Subscriber) {
      return 'registration';
    }
    if (savedMode === AppMode.Birth) {
      return 'plan';
    }
    return 'mode-select';
  });

  const [selectedMode, setSelectedMode] = useState<AppMode | null>(() => {
    return guestStorage.getSelectedMode();
  });

  if (isLoaded && isSignedIn) {
    navigate('/');
  }

  const handleModeSelect = useCallback(
    (mode: AppMode) => {
      guestStorage.saveMode(mode);
      setSelectedMode(mode);

      if (mode === AppMode.Subscriber) {
        setCurrentStep('registration');
      } else {
        setCurrentStep('plan');
      }
    },
    [guestStorage]
  );

  const handlePlanComplete = useCallback(() => {
    setCurrentStep('registration');
  }, []);

  const handleBackToMode = useCallback(() => {
    guestStorage.clearGuestData();
    setSelectedMode(null);
    setCurrentStep('mode-select');
  }, [guestStorage]);

  const handleBackToPlan = useCallback(() => {
    setCurrentStep('plan');
  }, []);

  return (
    <AppShell preAuth>
      {currentStep === 'mode-select' && <GuestModeSelect onModeSelect={handleModeSelect} />}
      {currentStep === 'plan' && (
        <GuestPlan onComplete={handlePlanComplete} onBack={handleBackToMode} />
      )}
      {currentStep === 'registration' && (
        <RegistrationPrompt
          mode={selectedMode}
          onBack={selectedMode === AppMode.Subscriber ? handleBackToMode : handleBackToPlan}
        />
      )}
    </AppShell>
  );
}
