import { useState } from 'react';
import { ContractionReadModel } from '@base/clients/labour_service/types';
import { useLabourSession } from '@base/contexts/LabourSessionContext';
import { useLabourClient } from '@base/hooks';
import { useEndContractionOffline } from '@base/offline/hooks';
import { IconHourglassHigh } from '@tabler/icons-react';
import { Button, Slider, Stack, Text } from '@mantine/core';
import classes from './ActiveContractionControls.module.css';

function EndContractionButton({
  intensity,
  disabled,
  contractionId,
}: {
  intensity: number;
  disabled: boolean;
  contractionId: string;
}) {
  const { labourId } = useLabourSession();
  const client = useLabourClient();
  const mutation = useEndContractionOffline(client);

  const handleEndContraction = () => {
    mutation.mutate({
      intensity,
      labourId: labourId!,
      contractionId,
    });
  };

  const icon = <IconHourglassHigh size={22} />;

  return (
    <Button
      leftSection={icon}
      radius="xl"
      size="xl"
      variant="filled"
      loading={mutation.isPending}
      onClick={handleEndContraction}
      disabled={disabled}
    >
      End Contraction
    </Button>
  );
}

export function ActiveContractionControls({
  activeContraction,
  disabled,
}: {
  activeContraction: ContractionReadModel;
  disabled: boolean;
  offset: number;
}) {
  const [intensity, setIntensity] = useState(5);

  return (
    <div className={classes.controlsCard}>
      <Stack gap="lg" align="center">
        {/* Intensity section */}
        <div className={classes.intensitySection}>
          <Text className={classes.sectionLabel}>Intensity</Text>
          <Slider
            classNames={{
              root: classes.slider,
              markLabel: classes.markLabel,
              track: classes.track,
              bar: classes.bar,
              thumb: classes.thumb,
            }}
            size="xl"
            radius="lg"
            min={0}
            max={10}
            step={1}
            defaultValue={5}
            onChange={setIntensity}
            marks={[
              { value: 0, label: 'mild' },
              { value: 5, label: 'moderate' },
              { value: 10, label: 'strong' },
            ]}
          />
        </div>

        {/* End button */}
        <div className={classes.buttonSection}>
          <EndContractionButton
            intensity={intensity}
            disabled={disabled}
            contractionId={activeContraction.contraction_id}
          />
        </div>
      </Stack>
    </div>
  );
}
