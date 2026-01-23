import { useState } from 'react';
import { LabourReadModel } from '@base/clients/labour_service';
import { useLabourClient, useUpdateLabourPlan } from '@base/hooks';
import { validateLabourName } from '@lib';
import { IconBabyCarriage, IconCalendar, IconCheck, IconPencil } from '@tabler/icons-react';
import { Button, Modal, Stack, Text, TextInput, UnstyledButton } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import classes from './EditLabourModal.module.css';
import modalClasses from '@styles/modal.module.css';

interface EditLabourModalProps {
  labour: LabourReadModel;
  isOpen: boolean;
  onClose: () => void;
}

export function EditLabourModal({ labour, isOpen, onClose }: EditLabourModalProps) {
  const client = useLabourClient();
  const updateLabourMutation = useUpdateLabourPlan(client);
  const [firstLabour, setFirstLabour] = useState(labour.first_labour);

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      dueDate: new Date(labour.due_date),
      labourName: labour.labour_name || '',
    },
    validate: { labourName: (value) => validateLabourName(value) },
  });

  const handleSubmit = (values: typeof form.values) => {
    updateLabourMutation.mutate(
      {
        labourId: labour.labour_id,
        firstLabour,
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
      title="Edit Labour Details"
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
      <Text className={classes.description} mb="lg">
        Update the details for this labour.
      </Text>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          {/* Due Date Section */}
          <div className={classes.section}>
            <div className={classes.sectionLabel}>
              <IconCalendar size={14} />
              <span>Due Date</span>
            </div>
            <DatePickerInput
              placeholder="Select due date"
              valueFormat="DD MMMM YYYY"
              size="md"
              key={form.key('dueDate')}
              {...form.getInputProps('dueDate')}
              classNames={{
                input: classes.input,
                section: classes.inputSection,
              }}
            />
          </div>

          {/* First Labour Section */}
          <div className={classes.section}>
            <div className={classes.sectionLabel}>
              <IconBabyCarriage size={14} />
              <span>First Labour</span>
            </div>
            <div className={classes.radioGroup}>
              <UnstyledButton
                className={classes.radioOption}
                data-selected={firstLabour || undefined}
                onClick={() => setFirstLabour(true)}
              >
                <div className={classes.radioCheck}>{firstLabour && <IconCheck size={12} />}</div>
                <span className={classes.radioLabel}>Yes, this is my first</span>
              </UnstyledButton>
              <UnstyledButton
                className={classes.radioOption}
                data-selected={!firstLabour || undefined}
                onClick={() => setFirstLabour(false)}
              >
                <div className={classes.radioCheck}>{!firstLabour && <IconCheck size={12} />}</div>
                <span className={classes.radioLabel}>No, I've had one before</span>
              </UnstyledButton>
            </div>
          </div>

          {/* Labour Name Section */}
          <div className={classes.section}>
            <div className={classes.sectionLabel}>
              <IconPencil size={14} />
              <span>Name (Optional)</span>
            </div>
            <TextInput
              key={form.key('labourName')}
              placeholder="e.g. Baby Fern's birth"
              size="md"
              {...form.getInputProps('labourName')}
              classNames={{
                input: classes.input,
                section: classes.inputSection,
              }}
            />
          </div>

          {/* Action Buttons */}
          <div className={classes.actionRow}>
            <Button
              size="sm"
              radius="lg"
              variant="default"
              className={classes.cancelButton}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" radius="lg" loading={updateLabourMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </Stack>
      </form>
    </Modal>
  );
}
