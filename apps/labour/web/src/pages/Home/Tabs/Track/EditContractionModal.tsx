import { useState } from 'react';
import { GenericConfirmModal } from '@base/components/Modals/GenericConfirmModal';
import { useLabourSession } from '@base/contexts/LabourSessionContext';
import { useLabourClient } from '@base/hooks';
import { useDeleteContractionOffline, useUpdateContractionOffline } from '@base/offline/hooks';
import { updateTime } from '@lib/calculations';
import { IconClock, IconTrash, IconUpload } from '@tabler/icons-react';
import { Button, Modal, Slider, Space, Text } from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { ContractionData } from './ContractionTimelineCustom';
import classes from './Contractions.module.css';
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
        title="Update Contraction"
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
        <form
          onSubmit={form.onSubmit((values) =>
            handleUpdateContraction({
              values,
              contractionId: contractionData!.contractionId,
            })
          )}
        >
          <Space h="lg" />
          <TimeInput
            rightSection={<IconClock />}
            withSeconds
            key={form.key('startTime')}
            radius="lg"
            label="Start Time"
            {...form.getInputProps('startTime')}
            classNames={{
              label: classes.timeInputLabel,
              input: classes.timeInput,
              section: classes.timeInputSection,
            }}
            defaultValue={getTime(contractionData?.startTime) || undefined}
          />
          <Space h="lg" />
          <TimeInput
            rightSection={<IconClock />}
            withSeconds
            key={form.key('endTime')}
            radius="lg"
            label="End Time"
            {...form.getInputProps('endTime')}
            classNames={{
              label: classes.timeInputLabel,
              input: classes.timeInput,
              section: classes.timeInputSection,
            }}
            defaultValue={getTime(contractionData?.endTime) || undefined}
          />
          <Space h="lg" />
          <Text
            size="sm"
            fw={500}
            c="light-dark(var(--mantine-color-gray-7), var(--mantine-color-gray-2))"
          >
            Intensity
          </Text>
          <Slider
            classNames={{
              root: classes.slider,
              markLabel: classes.markLabel,
              track: classes.track,
            }}
            key={form.key('intensity')}
            size="xl"
            radius="lg"
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
          <Space h="xl" />
          <div className={classes.flexRow}>
            <Button
              leftSection={<IconTrash />}
              variant="filled"
              radius="xl"
              size="md"
              h={48}
              w={48}
              px={0}
              styles={{ section: { marginLeft: 10 } }}
              onClick={() => setIsModalOpen(true)}
              loading={deleteMutation.isPending}
              aria-label="Delete contraction"
            />
            <Button
              leftSection={<IconUpload />}
              variant="light"
              radius="xl"
              size="md"
              h={48}
              flex={1}
              ml="sm"
              type="submit"
              loading={updateMutation.isPending}
            >
              Update
            </Button>
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
