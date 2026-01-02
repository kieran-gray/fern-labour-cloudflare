import { useLabourSession } from '@base/contexts';
import { useLabourClient, useSendLabourInvite } from '@base/hooks';
import { Card } from '@components/Cards/Card';
import { validateEmail } from '@lib';
import { IconAt, IconSend } from '@tabler/icons-react';
import { Button, Group, Space, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import image from './invite.svg';
import classes from './InviteByEmail.module.css';
import baseClasses from '@styles/base.module.css';

export function InviteByEmail() {
  const { labourId } = useLabourSession();
  const client = useLabourClient();
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      email: '',
    },

    validate: {
      email: (value) => (validateEmail(value) ? null : 'Invalid email'),
    },
  });

  const sendInviteMutation = useSendLabourInvite(client);

  const handleSubmit = (values: typeof form.values) => {
    sendInviteMutation.mutate(
      {
        email: values.email,
        labourId: labourId!,
      },
      {
        onSuccess: () => {
          form.reset();
        },
      }
    );
  };

  return (
    <Card
      title="Or send invites by email"
      description="Invite your friends and family, we'll give them instructions on how to sign up and what to expect."
      image={{ src: image, width: 250, height: 220 }}
      imagePosition="left"
      mobileImage={{ src: image, width: 220, height: 200 }}
    >
      <Group>
        <form onSubmit={form.onSubmit(handleSubmit)} style={{ width: '100%' }}>
          <div className={classes.flexRowEnd}>
            <TextInput
              withAsterisk
              radius="lg"
              mt="md"
              rightSectionPointerEvents="none"
              rightSection={<IconAt size={16} />}
              label="Email"
              placeholder="friend@email.com"
              key={form.key('email')}
              size="lg"
              classNames={{
                description: baseClasses.description,
                input: baseClasses.input,
                section: baseClasses.section,
              }}
              {...form.getInputProps('email')}
            />
            <Space w="md" />
            <Button
              variant="filled"
              rightSection={<IconSend size={20} stroke={1.5} />}
              radius="xl"
              size="lg"
              pr={14}
              mt="var(--mantine-spacing-lg)"
              loading={sendInviteMutation.isPending}
              styles={{ section: { marginLeft: 22 }, label: { overflow: 'unset' } }}
              type="submit"
              visibleFrom="sm"
            >
              Send invite
            </Button>
            <Button
              variant="filled"
              rightSection={<IconSend size={20} stroke={1.5} />}
              radius="xl"
              size="md"
              pr={14}
              h={48}
              mt="var(--mantine-spacing-md)"
              loading={sendInviteMutation.isPending}
              styles={{ section: { marginLeft: 22 }, label: { overflow: 'unset' } }}
              type="submit"
              hiddenFrom="sm"
            >
              Send invite
            </Button>
          </div>
        </form>
      </Group>
    </Card>
  );
}
