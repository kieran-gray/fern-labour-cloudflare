import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { IconAt, IconBrandInstagram, IconBulb, IconSend } from '@tabler/icons-react';
import { Alert, Checkbox, Rating, Select, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { validateEmail, validateMessage, validateName } from '@/utils/FormValidation';
import classes from './ContactUs.module.css';

const Turnstile = dynamic(() => import('react-turnstile').then((m) => m.default), {
  ssr: false,
});

const categories = [
  { label: 'An Error Report', value: 'ERROR' },
  { label: 'An Idea', value: 'IDEA' },
  { label: 'A Testimonial', value: 'TESTIMONIAL' },
  { label: 'Other', value: 'OTHER' },
];

export function ContactUs() {
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [checked, setChecked] = useState(false);
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const searchParams = useSearchParams();
  const promptParam = searchParams.get('show');
  const defaultCategory = promptParam ? promptParam : 'ERROR';

  const form = useForm({
    initialValues: {
      category: defaultCategory,
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
    if (values.category === 'TESTIMONIAL') {
      data = { rating: rating.toString(), consent: checked ? 'true' : 'false' };
    }

    try {
      await fetch(`${contactServiceURL}/api/v1/contact-us/`, {
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
      });

      setSent(true);
      form.reset();
      setStatus({
        type: 'Success',
        message: "Message sent successfully! We'll get back to you soon.",
      });
    } catch (error) {
      setStatus({
        type: 'Error',
        message: 'Something went wrong. Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  function getTextAreaPlaceholder(values: typeof form.values): string {
    if (values.category === 'IDEA') {
      return 'What feature would you like to see?';
    } else if (values.category === 'TESTIMONIAL') {
      return 'Share your thoughts!';
    } else if (values.category === 'ERROR') {
      return 'Please describe the issue with as much detail as you can';
    }
    return 'Share your thoughts or describe the issue...';
  }

  const isTestimonial = form.values.category === 'TESTIMONIAL';

  return (
    <div className={classes.container}>
      <div className={classes.card}>
        <header className={classes.header}>
          <div className={classes.headerDecoration} />
          <p className={classes.greeting}>Get in touch</p>
          <h1 className={classes.title}>We'd love to hear from you</h1>
          <p className={classes.subtitle}>
            If you have feedback, an idea, or simply want to get in touch, we’re listening.
          </p>
        </header>

        {status.type && (
          <Alert
            variant="light"
            color={status.type === 'Success' ? 'green' : 'red'}
            radius="md"
            title={status.type}
            mb={20}
            withCloseButton
            onClose={() => setStatus({ type: '', message: '' })}
          >
            {status.message}
          </Alert>
        )}

        <form className={classes.form} onSubmit={form.onSubmit((values) => handleSubmit(values))}>
          <div className={classes.fieldGroup}>
            <div className={classes.categorySelector}>
              <span className={classes.categoryLabel}>This is</span>
              <Select
                data={categories}
                key={form.key('category')}
                defaultValue={defaultCategory}
                {...form.getInputProps('category')}
                classNames={{
                  input: classes.selectInput,
                  dropdown: classes.selectDropdown,
                  option: classes.selectOption,
                }}
                allowDeselect={false}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <TextInput
              required
              placeholder="Name"
              key={form.key('name')}
              {...form.getInputProps('name')}
              style={{ flex: 1, minWidth: '200px' }}
              classNames={{ input: classes.textInput }}
            />
            <TextInput
              required
              placeholder="Email"
              key={form.key('email')}
              {...form.getInputProps('email')}
              style={{ flex: 1, minWidth: '200px' }}
              classNames={{ input: classes.textInput }}
            />
          </div>

          {isTestimonial && (
            <div className={classes.testimonialCard}>
              <div className={classes.testimonialHeader}>
                <IconBulb size={18} className={classes.testimonialIcon} />
                <span className={classes.testimonialTitle}>Share your experience</span>
              </div>
              <div className={classes.hintsList}>
                <span className={classes.hintItem}>Your birth journey</span>
                <span className={classes.hintItem}>Favourite features</span>
                <span className={classes.hintItem}>Tips for others</span>
              </div>
              <div className={classes.ratingRow}>
                <span className={classes.ratingLabel}>Your rating</span>
                <Rating defaultValue={5} size="md" value={rating} onChange={setRating} />
              </div>
            </div>
          )}

          <div className={classes.fieldGroup}>
            <Textarea
              required
              key={form.key('message')}
              placeholder={getTextAreaPlaceholder(form.values)}
              minRows={5}
              maxRows={8}
              data-autofocus
              autosize
              classNames={{ input: classes.textareaInput }}
              {...form.getInputProps('message')}
            />
          </div>

          {isTestimonial && (
            <div className={classes.consentRow}>
              <Checkbox
                label="I give permission to use this testimonial for marketing."
                checked={checked}
                onChange={(event) => setChecked(event.currentTarget.checked)}
                classNames={{ label: classes.consentLabel }}
              />
            </div>
          )}

          <div className={classes.turnstileContainer}>
            <Turnstile
              sitekey={process.env.NEXT_PUBLIC_CLOUDFLARE_SITEKEY || '1x00000000000000000000AA'}
              onVerify={(token) => setTurnstileToken(token)}
              appearance="interaction-only"
            />
          </div>

          <div className={classes.formFooter}>
            <div className={classes.footerRow}>
              <div className={classes.contactLinks}>
                <span className={classes.contactLink}>
                  <IconAt size={14} className={classes.contactLinkIcon} />
                  support@fernlabour.com
                </span>
                <a
                  href="https://www.instagram.com/fernlabour/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={classes.contactLink}
                >
                  <IconBrandInstagram size={14} className={classes.contactLinkIcon} />
                  @fernlabour
                </a>
              </div>
              <button
                type="submit"
                className={classes.submitButton}
                disabled={isLoading || turnstileToken === null || sent}
              >
                {isLoading ? (
                  <>
                    <span className={classes.loadingSpinner} />
                    Sending...
                  </>
                ) : (
                  <>
                    <IconSend size={18} />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
