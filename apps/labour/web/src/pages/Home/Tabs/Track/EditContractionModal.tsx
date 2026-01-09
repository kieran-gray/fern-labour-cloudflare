import { useState } from 'react';
import { GenericConfirmModal } from '@base/components/Modals/GenericConfirmModal';
import { useLabourSession } from '@base/contexts/LabourSessionContext';
import { useLabourClient } from '@base/hooks';
import { useDeleteContractionOffline, useUpdateContractionOffline } from '@base/offline/hooks';
import { updateTime } from '@lib/calculations';
import { IconClock, IconFlame, IconTrash } from '@tabler/icons-react';
import { ActionIcon, Button, Modal, Slider, Text } from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { ContractionData } from './ContractionTimelineCustom';
import classes from './EditContractionModal.module.css';
import modalClasses from '@styles/modal.module.css';

type CloseFunctionType = (...args: any[]) => void;

export const EditContractionModal = ({
  contractionData,
  opened,
  close,
}: {
  contractionData: ContractionData;
  opened: boolean;
  close: CloseFunctionType;
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { labourId } = useLabourSession();

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      startTime: '',
      endTime: '',
      intensity: undefined,
    },
  });

  const client = useLabourClient();
  const deleteMutation = useDeleteContractionOffline(client);
  const updateMutation = useUpdateContractionOffline(client);

  const handleDeleteContraction = (contractionId: string) => {
    const payload = {
      labourId: labourId!,
      contractionId,
    };
    deleteMutation.mutate(payload, {
      onSuccess: () => {
        close();
      },
    });
  };

  const handleUpdateContraction = ({
    values,
    contractionId,
  }: {
    values: typeof form.values;
    contractionId: string;
  }) => {
    const startTime =
      values.startTime !== ''
        ? updateTime(contractionData!.startTime, values.startTime)
        : contractionData!.startTime;
    const endTime =
      values.endTime !== ''
        ? updateTime(contractionData!.endTime, values.endTime)
        : contractionData!.endTime;

    const requestBody = {
      labourId: labourId!,
      contractionId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      intensity: values.intensity != null ? values.intensity : contractionData!.intensity!,
    };

    updateMutation.mutate(requestBody, {
      onSuccess: () => {
        form.reset();
        close();
      },
    });
  };

  const handleConfirm = () => {
    setIsModalOpen(false);
    handleDeleteContraction(contractionData!.contractionId);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const getTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString(navigator.language, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        title="Edit Contraction"
        centered
        overlayProps={{ backgroundOpacity: 0.4, blur: 3 }}
        classNames={{
          content: modalClasses.modalRoot,
          header: modalClasses.modalHeader,
          title: modalClasses.modalTitle,
          body: modalClasses.modalBody,
          close: modalClasses.closeButton,
        }}
      >
        <Text className={classes.description} mb="lg">
          Adjust the timing or intensity of this contraction.
        </Text>

        <form
          onSubmit={form.onSubmit((values) =>
            handleUpdateContraction({
              values,
              contractionId: contractionData!.contractionId,
            })
          )}
        >
          <div className={classes.formContainer}>
            {/* Time Section */}
            <div className={classes.timeSection}>
              <div className={classes.timeSectionLabel}>
                <IconClock size={14} />
                <span>Timing</span>
              </div>
              <div className={classes.timeInputsRow}>
                <div className={classes.timeInputWrapper}>
                  <Text className={classes.timeInputLabel}>Start</Text>
                  <TimeInput
                    withSeconds
                    key={form.key('startTime')}
                    {...form.getInputProps('startTime')}
                    classNames={{
                      input: classes.timeInput,
                      section: classes.timeInputSection,
                    }}
                    defaultValue={getTime(contractionData?.startTime) || undefined}
                    size="md"
                  />
                </div>
                <div className={classes.timeInputWrapper}>
                  <Text className={classes.timeInputLabel}>End</Text>
                  <TimeInput
                    withSeconds
                    key={form.key('endTime')}
                    {...form.getInputProps('endTime')}
                    classNames={{
                      input: classes.timeInput,
                      section: classes.timeInputSection,
                    }}
                    defaultValue={getTime(contractionData?.endTime) || undefined}
                    size="md"
                  />
                </div>
              </div>
            </div>

            {/* Intensity Section */}
            <div className={classes.intensitySection}>
              <div className={classes.intensityHeader}>
                <div className={classes.intensitySectionLabel}>
                  <IconFlame size={14} />
                  <span>Intensity</span>
                </div>
              </div>
              <div className={classes.sliderWrapper}>
                <Slider
                  classNames={{
                    root: classes.slider,
                    markLabel: classes.markLabel,
                    track: classes.track,
                  }}
                  key={form.key('intensity')}
                  size="lg"
                  min={0}
                  max={10}
                  step={1}
                  {...form.getInputProps('intensity')}
                  defaultValue={contractionData?.intensity || undefined}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 5, label: 5 },
                    { value: 10, label: 10 },
                  ]}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className={classes.actionRow}>
              <ActionIcon
                variant="default"
                size="xl"
                radius="lg"
                className={classes.deleteButton}
                onClick={() => setIsModalOpen(true)}
                loading={deleteMutation.isPending}
                aria-label="Delete contraction"
              >
                <IconTrash size={18} />
              </ActionIcon>
              <Button
                radius="lg"
                size="md"
                className={classes.updateButton}
                type="submit"
                loading={updateMutation.isPending}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </form>
      </Modal>
      <GenericConfirmModal
        isOpen={isModalOpen}
        title="Delete Contraction?"
        confirmText="Delete"
        message="This can't be undone."
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isDangerous
      />
    </>
  );
};
