import { LabourReadModel } from '@base/clients/labour_service';
import { useLabourClient, useUpdateLabourPlan } from '@base/hooks';
import { validateLabourName } from '@lib';
import { IconCalendar, IconPencil } from '@tabler/icons-react';
import { Button, Group, Modal, Radio, Stack, TextInput } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import baseClasses from '@styles/base.module.css';
import modalClasses from '@styles/modal.module.css';

interface EditLabourModalProps {
  labour: LabourReadModel;
  isOpen: boolean;
  onClose: () => void;
}

export function EditLabourModal({ labour, isOpen, onClose }: EditLabourModalProps) {
  const client = useLabourClient();
  const updateLabourMutation = useUpdateLabourPlan(client);

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      dueDate: new Date(labour.due_date),
      firstLabour: labour.first_labour ? 'true' : 'false',
      labourName: labour.labour_name || '',
    },
    validate: { labourName: (value) => validateLabourName(value) },
  });

  const handleSubmit = (values: typeof form.values) => {
    updateLabourMutation.mutate(
      {
        labourId: labour.labour_id,
        firstLabour: values.firstLabour === 'true',
        dueDate: values.dueDate,
        labourName: values.labourName || undefined,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title="Edit labour details"
      size="md"
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
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <DatePickerInput
            placeholder="Due date"
            rightSection={<IconCalendar size={16} stroke={1.5} />}
            valueFormat="DD/MM/YYYY"
            label="Estimated due date"
            radius="md"
            size="sm"
            required
            key={form.key('dueDate')}
            {...form.getInputProps('dueDate')}
            classNames={{
              input: baseClasses.input,
              section: baseClasses.section,
              levelsGroup: baseClasses.selectDropdown,
              label: modalClasses.inputLabel,
            }}
          />

          <Radio.Group
            name="firstLabour"
            key={form.key('firstLabour')}
            label="Is this your first labour?"
            size="sm"
            {...form.getInputProps('firstLabour')}
            classNames={{ label: modalClasses.inputLabel }}
          >
            <Group mt={4}>
              <Radio
                value="true"
                label="Yes"
                size="sm"
                classNames={{ label: modalClasses.inputLabel }}
              />
              <Radio
                value="false"
                label="No"
                size="sm"
                classNames={{ label: modalClasses.inputLabel }}
              />
            </Group>
          </Radio.Group>

          <TextInput
            rightSection={<IconPencil size={16} stroke={1.5} />}
            key={form.key('labourName')}
            label="Labour name (optional)"
            placeholder="Baby Fern's birth"
            size="sm"
            radius="md"
            {...form.getInputProps('labourName')}
            classNames={{
              input: baseClasses.input,
              section: baseClasses.section,
              label: modalClasses.inputLabel,
            }}
            styles={{ input: { padding: '25px 15px' } }}
          />

          <Group justify="flex-end" mt="sm">
            <Button variant="default" size="sm" onClick={onClose} radius="md">
              Cancel
            </Button>
            <Button type="submit" size="sm" radius="md" loading={updateLabourMutation.isPending}>
              Save changes
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
