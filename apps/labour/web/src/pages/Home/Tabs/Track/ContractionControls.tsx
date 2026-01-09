import { ContractionReadModel } from '@base/clients/labour_service/types';
import { useLabourSession } from '@base/contexts/LabourSessionContext';
import { useLabourClient, useServerOffset } from '@base/hooks';
import { generateContractionId, useStartContractionOffline } from '@base/offline/hooks';
import { IconHourglassLow } from '@tabler/icons-react';
import { Button } from '@mantine/core';
import { ActiveContractionControls } from './ActiveContractionControls';
import classes from './Contractions.module.css';

function StartContractionButton({ offset }: { offset: number }) {
  const { labourId } = useLabourSession();
  const client = useLabourClient();
  const mutation = useStartContractionOffline(client);

  const handleStartContraction = () => {
    const contractionId = generateContractionId();
    const startTime = new Date(Date.now() + offset);
    mutation.mutate({
      labourId: labourId!,
      contractionId,
      startTime,
    });
  };

  const icon = <IconHourglassLow size={22} />;

  return (
    <Button
      leftSection={icon}
      radius="xl"
      size="xl"
      variant="filled"
      loading={mutation.isPending}
      onClick={handleStartContraction}
    >
      Start Contraction
    </Button>
  );
}

interface ContractionControlsProps {
  labourCompleted: boolean;
  activeContraction: ContractionReadModel | undefined;
}

export function ContractionControls({
  labourCompleted,
  activeContraction,
}: ContractionControlsProps) {
  const { labourId } = useLabourSession();
  const client = useLabourClient();
  const { data: offsetData } = useServerOffset(client, labourId);
  const offset = offsetData || 0;

  if (labourCompleted) {
    return null;
  }

  return (
    <div className={classes.controlsWrapper}>
      <div className={classes.controlsContainer}>
        {activeContraction ? (
          <ActiveContractionControls
            activeContraction={activeContraction}
            disabled={false}
            offset={offset}
          />
        ) : (
          <div className={classes.controlsCenter}>
            <StartContractionButton offset={offset} />
          </div>
        )}
      </div>
    </div>
  );
}
