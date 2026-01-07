import { SubscriberContactMethod, SubscriptionReadModel } from '@base/clients/labour_service';
import { useLabourSession } from '@base/contexts';
import { useLabourClient } from '@base/hooks';
import { useUpdateNotificationMethods } from '@base/hooks/useLabourData';
import { IconSelector, IconUpload } from '@tabler/icons-react';
import { useSearchParams } from 'react-router-dom';
import { Button, Modal, MultiSelect } from '@mantine/core';
import { useForm } from '@mantine/form';
import classes from './ContactMethodsModal.module.css';
import modalClasses from '@styles/modal.module.css';

type CloseFunctionType = (...args: any[]) => void;

export default function ContactMethodsModal({
  subscription,
  opened,
  close,
}: {
  subscription: SubscriptionReadModel;
  opened: boolean;
  close: CloseFunctionType;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { labourId } = useLabourSession();
  const prompt = searchParams.get('prompt');

  const defaultIcon = <IconUpload size={18} stroke={1.5} />;

  const form = useForm({
    mode: 'controlled',
    initialValues: {
      contactMethods: subscription.contact_methods,
    },
  });

  const client = useLabourClient();
  const mutation = useUpdateNotificationMethods(client);
  const handleUpdateContactMethods = (values: typeof form.values) => {
    const requestBody = {
      labourId: labourId!,
      subscriptionId: subscription.subscription_id,
      methods: values.contactMethods,
    };
    mutation.mutate(requestBody, {
      onSuccess: () => {
        if (prompt === 'contactMethods') {
          searchParams.delete('prompt');
          setSearchParams(searchParams);
        }
        close();
      },
    });
  };

  const options = [
    {
      value: 'WHATSAPP',
      label: 'WhatsApp',
      disabled: form.values.contactMethods.includes(SubscriberContactMethod.SMS),
    },
    {
      value: 'SMS',
      label: 'Text',
      disabled: form.values.contactMethods.includes(SubscriberContactMethod.WHATSAPP),
    },
  ];

  return (
    <Modal
      opened={opened}
      closeOnClickOutside
      onClose={() => {
        searchParams.delete('prompt');
        setSearchParams(searchParams);
        close();
      }}
      title="Contact Methods"
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
      <div style={{ padding: '20px 10px 10px' }}>
        <form onSubmit={form.onSubmit((values) => handleUpdateContactMethods(values))}>
          <div className={classes.flexColumn}>
            <MultiSelect
              rightSection={<IconSelector size={18} stroke={1.5} />}
              key={form.key('contactMethods')}
              placeholder="Select"
              label="Update your contact methods"
              description="How would you like to be notified about updates to this labour?"
              data={options}
              size="md"
              radius="xl"
              {...form.getInputProps('contactMethods')}
              classNames={{
                wrapper: classes.input,
                pill: classes.pill,
                description: classes.description,
                inputField: classes.input,
                options: classes.options,
                label: classes.label,
              }}
              comboboxProps={{
                transitionProps: { transition: 'pop', duration: 200 },
                shadow: 'md',
              }}
              clearable
            />
            <Button
              leftSection={defaultIcon}
              variant="outline"
              radius="xl"
              size="md"
              h={48}
              className={classes.submitButton}
              styles={{ section: { marginRight: 22 } }}
              type="submit"
              loading={mutation.isPending}
              visibleFrom="xs"
            >
              Update Contact Methods
            </Button>
            <Button
              leftSection={defaultIcon}
              variant="outline"
              radius="xl"
              size="sm"
              h={48}
              className={classes.submitButton}
              styles={{ section: { marginRight: 22 } }}
              type="submit"
              loading={mutation.isPending}
              hiddenFrom="xs"
            >
              Update Contact Methods
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
