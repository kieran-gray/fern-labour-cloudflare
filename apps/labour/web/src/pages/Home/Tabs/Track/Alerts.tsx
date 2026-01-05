import { useState } from 'react';
import { ContractionReadModel } from '@base/clients/labour_service/types';
import { AlertType, calculateAlerts } from '@lib/alerts';
import { IconAmbulance, IconBackpack, IconPhone } from '@tabler/icons-react';
import { Alert } from '@mantine/core';

type AlertContainerProps = {
  contractions: ContractionReadModel[];
  firstLabour: boolean;
};

type AlertProps = {
  onClose: () => void;
};

export function AlertContainer({ contractions, firstLabour }: AlertContainerProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<AlertType>>(new Set());

  const alertState = calculateAlerts(contractions, firstLabour);

  const handleDismiss = (alertType: AlertType) => {
    setDismissedAlerts((prev) => new Set(prev).add(alertType));
  };

  const getAlertToShow = (): AlertType | null => {
    if (alertState.callMidwife && !dismissedAlerts.has('callMidwife')) {
      return 'callMidwife';
    }
    if (alertState.goToHospital && !dismissedAlerts.has('goToHospital')) {
      return 'goToHospital';
    }
    if (alertState.prepareForHospital && !dismissedAlerts.has('prepareForHospital')) {
      return 'prepareForHospital';
    }
    return null;
  };

  const alertToShow = getAlertToShow();

  switch (alertToShow) {
    case 'callMidwife':
      return <CallMidwifeAlert onClose={() => handleDismiss('callMidwife')} />;
    case 'goToHospital':
      return <GoToHospitalAlert onClose={() => handleDismiss('goToHospital')} />;
    case 'prepareForHospital':
      return <PrepareForHospitalAlert onClose={() => handleDismiss('prepareForHospital')} />;
    default:
      return null;
  }
}

export function CallMidwifeAlert({ onClose }: AlertProps) {
  return (
    <Alert
      variant="light"
      color="red"
      radius="md"
      withCloseButton
      title="Time to call your midwife"
      icon={<IconPhone />}
      onClose={onClose}
    >
      We think that you should call the midwife urgently, we suggest this because either:
      <br />- one of your contractions lasted longer than 2 minutes
      <br />- you have had 6 or more contractions in a 10 minute period
    </Alert>
  );
}

export function GoToHospitalAlert({ onClose }: AlertProps) {
  return (
    <Alert
      variant="light"
      color="orange"
      radius="md"
      withCloseButton
      title="Time to go to the hospital"
      icon={<IconAmbulance />}
      onClose={onClose}
    >
      Your contractions are regular and strong, which means your labour is well underway.
      <br />
      Take a deep breath, gather your things, and go to the hospital safely.
    </Alert>
  );
}

export function PrepareForHospitalAlert({ onClose }: AlertProps) {
  return (
    <Alert
      variant="light"
      color="orange"
      radius="md"
      withCloseButton
      title="Prepare to go to the hospital"
      icon={<IconBackpack />}
      onClose={onClose}
    >
      Your contractions are becoming more consistent.
      <br />
      If they remain this strong and frequent for an hour, it will be time to go to the hospital.
      <br />
      Stay relaxed and keep monitoring.
    </Alert>
  );
}
