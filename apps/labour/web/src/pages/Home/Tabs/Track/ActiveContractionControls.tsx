import { useState } from 'react';
import { ContractionReadModel } from '@base/clients/labour_service/types';
import { useLabourSession } from '@base/contexts/LabourSessionContext';
import { useLabourClient } from '@base/hooks';
import { useEndContractionOffline } from '@base/offline/hooks';
import { IconHourglassHigh } from '@tabler/icons-react';
import { Button, Slider, Stack, Text } from '@mantine/core';
import Stopwatch from './Stopwatch';
import classes from './Contractions.module.css';

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
      variant="outline"
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
  offset,
}: {
  activeContraction: ContractionReadModel;
  disabled: boolean;
  offset: number;
}) {
  const [intensity, setIntensity] = useState(5);
  const startTimestamp = new Date(activeContraction.duration.start_time).getTime();

  return (
    <Stack gap="lg" align="center">
      <div className={classes.stopwatchWrapper}>
        <Stopwatch startTimestamp={startTimestamp} offset={offset} />
      </div>
      <div className={classes.sliderGroup}>
        <Text className={classes.sliderLabel}>Your contraction intensity</Text>
        <Slider
          classNames={{
            root: classes.slider,
            markLabel: classes.markLabel,
            track: classes.track,
          }}
          size="xl"
          radius="lg"
          min={0}
          max={10}
          step={1}
          defaultValue={5}
          onChange={setIntensity}
          marks={[
            { value: 0, label: '0' },
            { value: 5, label: '5' },
            { value: 10, label: '10' },
          ]}
        />
      </div>
      <div className={classes.controlsCenter}>
        <EndContractionButton
          intensity={intensity}
          disabled={disabled}
          contractionId={activeContraction.contraction_id}
        />
      </div>
    </Stack>
  );
}
