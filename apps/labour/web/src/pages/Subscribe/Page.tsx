import { AppMode, useLabourSession } from '@base/contexts';
import { useLabourClient, useRequestAccess } from '@base/hooks';
import { AppShell } from '@components/AppShell';
import { Card } from '@components/Cards/Card';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button, Group, PinInput, Space } from '@mantine/core';
import { useForm } from '@mantine/form';
import image from './protected.svg';
import classes from './Form.module.css';
import baseClasses from '@styles/base.module.css';

const SUBSCRIBER_TOKEN_LENGTH = 5;

export const SubscribePage: React.FC = () => {
  const { id } = useParams<'id'>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setMode } = useLabourSession();
  const token = searchParams.get('token');
  if (!id) {
    throw new Error('id is required');
  }

  const labourId = id;

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      token: token || '',
    },
    validate: {
      token: (value) => (value.length !== SUBSCRIBER_TOKEN_LENGTH ? 'Invalid token' : null),
    },
  });

  const client = useLabourClient();
  const mutation = useRequestAccess(client);

  const handleSubscribeTo = (values: typeof form.values) => {
    const requestBody = { labourId, token: values.token };
    mutation.mutate(requestBody, {
      onSuccess: () => {
        setMode(AppMode.Subscriber);
        navigate(`/?prompt=requested`);
      },
    });
  };

  const description = (
    <>
      If the code isn't already filled in, check the share message that was sent to you, or ask the
      person who shared the link with you for the code.
    </>
  );

  return (
    <AppShell>
      <div className={baseClasses.flexPageColumn}>
        <Card
          title="Congratulations, someone wants to share their labour journey with you!"
          description={description}
          image={{ src: image, width: 376, height: 356 }}
          mobileImage={{ src: image, width: 300, height: 250 }}
        >
          <Group mt={30}>
            <form
              onSubmit={form.onSubmit((values) => handleSubscribeTo(values))}
              className={classes.form}
            >
              <div className={classes.flexRowEnd}>
                <PinInput
                  fw={600}
                  size="lg"
                  length={SUBSCRIBER_TOKEN_LENGTH}
                  radius="md"
                  style={{ justifyContent: 'center' }}
                  styles={{
                    input: {
                      color: 'light-dark(var(--mantine-color-black), var(--mantine-color-gray-1))',
                    },
                  }}
                  key={form.key('token')}
                  {...form.getInputProps('token')}
                />
                <Space w="xl" h="xl" />
                <Button
                  size="lg"
                  radius="lg"
                  variant="filled"
                  type="submit"
                  loading={mutation.isPending}
                >
                  Submit
                </Button>
              </div>
            </form>
          </Group>
        </Card>
      </div>
    </AppShell>
  );
};
