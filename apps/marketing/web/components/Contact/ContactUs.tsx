import { useState } from 'react';
import dynamic from 'next/dynamic';
import { IconInfoCircle } from '@tabler/icons-react';
import {
  Alert,
  Button,
  Checkbox,
  Container,
  Group,
  Rating,
  Select,
  SimpleGrid,
  Space,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { validateEmail, validateMessage, validateName } from '@/utils/FormValidation';
import { ContactIconsList } from './ContactIcons';
import classes from './ContactUs.module.css';

const Turnstile = dynamic(() => import('react-turnstile').then((m) => m.default), {
  ssr: false,
});

const categories = [
  { label: 'An Error Report', value: 'error_report' },
  { label: 'An Idea', value: 'idea' },
  { label: 'A Testimonial', value: 'testimonial' },
  { label: 'Other', value: 'other' },
];

export function ContactUs() {
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [checked, setChecked] = useState(false);
  const form = useForm({
    initialValues: {
      category: 'error_report',
      email: '',
      name: '',
      message: '',
    },

    validate: {
      email: (value) => (validateEmail(value) ? null : 'Invalid email'),
      name: (value) => validateName(value),
      message: (value) => validateMessage(value),
    },
  });

  const contactServiceURL = process.env.NEXT_PUBLIC_CONTACT_SERVICE_URL;

  const handleSubmit = async (values: typeof form.values) => {
    setIsLoading(true);
    let data = {};
    if (values.category === 'testimonial') {
      data = { rating, consent: checked };
    }

    setTimeout(() => {
      form.reset();
      setIsLoading(false);
      setStatus({
        type: 'Success',
        message: "Message sent successfully! We'll get back to you soon.",
      });
    }, 300);

    fetch(`${contactServiceURL}/api/v1/contact-us/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: values.email,
        name: values.name,
        message: values.message,
        token: turnstileToken,
        category: values.category,
        data,
      }),
    }).catch(() => {
      // Do nothing
    });
  };

  function getTextAreaPlaceholder(values: typeof form.values): string {
    if (values.category === 'idea') {
      return 'What feature would you like to see?';
    } else if (values.category === 'testimonial') {
      return 'Share your thoughts!';
    } else if (values.category === 'error_report') {
      return 'Please describe the issue with as much detail as you can';
    }
    return 'Share your thoughts or describe the issue...';
  }

  function hideTestimonialInputs(values: typeof form.values): boolean {
    return values.category !== 'testimonial';
  }

  return (
    <Container mt={20} className={classes.wrapper} size="lg">
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={50}>
        <div>
          <Title className={classes.title}>Contact us</Title>
          <Text className={classes.description} mt="sm" mb={30}>
            Leave your email and we will get back to you within 24 hours
          </Text>
          <ContactIconsList />
        </div>
        <form className={classes.form} onSubmit={form.onSubmit((values) => handleSubmit(values))}>
          {status.type && (
            <Alert
              variant="light"
              color="green"
              radius="md"
              title={status.type}
              icon={<IconInfoCircle />}
              mb={10}
              withCloseButton
              onClose={() => setStatus({ type: '', message: '' })}
            >
              {status.message}
            </Alert>
          )}
          <Group>
            <Text>This is</Text>
            <Select
              data={categories}
              key={form.key('category')}
              defaultValue="error_report"
              {...form.getInputProps('category')}
              classNames={{ input: classes.input, label: classes.inputLabel }}
              allowDeselect={false}
              withAsterisk
            />
          </Group>
          <Group mb={30} gap="xs" display={hideTestimonialInputs(form.values) ? 'none' : ''}>
            <Title order={5} mt={15} c="var(--mantine-color-gray-7)">
              Need ideas? Answer the following questions!
            </Title>
            <Text size="sm" c="var(--mantine-color-gray-7)">
              • How did Fern Labour fit into your birth plan?
            </Text>
            <Text size="sm" c="var(--mantine-color-gray-7)">
              • What advice would you give someone considering Fern Labour for their own journey?
            </Text>
            <Text size="sm" c="var(--mantine-color-gray-7)">
              • What was your favourite part of Fern Labour?
            </Text>
          </Group>
          <Rating
            defaultValue={5}
            size="lg"
            value={rating}
            onChange={setRating}
            display={hideTestimonialInputs(form.values) ? 'none' : ''}
          />
          <Textarea
            required
            key={form.key('message')}
            placeholder={getTextAreaPlaceholder(form.values)}
            minRows={5}
            maxRows={8}
            data-autofocus
            autosize
            mt="md"
            classNames={{ input: classes.input, label: classes.inputLabel }}
            {...form.getInputProps('message')}
          />
          <Group align="center" justify="space-around" mt="md">
            <TextInput
              label="Email"
              required
              key={form.key('email')}
              placeholder="your@email.com"
              style={{ flexGrow: 1 }}
              classNames={{ input: classes.input, label: classes.inputLabel }}
              {...form.getInputProps('email')}
            />
            <TextInput
              required
              label="Name"
              key={form.key('name')}
              placeholder="John Doe"
              style={{ flexGrow: 1 }}
              classNames={{ input: classes.input, label: classes.inputLabel }}
              {...form.getInputProps('name')}
            />
          </Group>

          <Checkbox
            mt={25}
            label="I give permission to use this testimonial across social channels and other marketing materials."
            checked={checked}
            onChange={(event) => setChecked(event.currentTarget.checked)}
            display={hideTestimonialInputs(form.values) ? 'none' : ''}
          />
          <Space h={20} />
          <Group align="center" justify="center" mt={10}>
            <Turnstile
              sitekey={process.env.NEXT_PUBLIC_CLOUDFLARE_SITEKEY || '1x00000000000000000000AA'}
              onVerify={(token) => setTurnstileToken(token)}
            />
          </Group>

          <Group justify="flex-end" mt="md">
            <Button
              type="submit"
              className={classes.control}
              radius="lg"
              disabled={isLoading || status.type !== ''}
            >
              {isLoading ? 'Sending...' : 'Submit'}
            </Button>
          </Group>
        </form>
      </SimpleGrid>
    </Container>
  );
}
