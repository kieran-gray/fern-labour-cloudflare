import { useState } from 'react';
import { useSubmitContactForm } from '@base/hooks/useContactData';
import { useUser } from '@clerk/clerk-react';
import type { CreateContactMessageRequest } from '@clients/contact_service';
import { validateMessage } from '@lib';
import { IconAt, IconBrandInstagram, IconBulb, IconCheck, IconSend } from '@tabler/icons-react';
import { useSearchParams } from 'react-router-dom';
import Turnstile from 'react-turnstile';
import { Alert, Checkbox, Rating, Select, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import classes from './ContactUs.module.css';
import baseClasses from '@styles/base.module.css';

const categories = [
  { label: 'An Error Report', value: 'error_report' },
  { label: 'An Idea', value: 'idea' },
  { label: 'A Testimonial', value: 'testimonial' },
  { label: 'Other', value: 'other' },
];

export function ContactUs() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [rating, setRating] = useState(5);
  const [checked, setChecked] = useState(false);

  const [searchParams] = useSearchParams();
  const promptParam = searchParams.get('show');
  const defaultCategory = promptParam ? promptParam : 'error_report';

  const form = useForm({
    initialValues: {
      category: defaultCategory,
      message: '',
    },
    validate: { message: (message) => validateMessage(message) },
  });

  const contactUsMutation = useSubmitContactForm();
  const handleContactUsSubmission = async (values: typeof form.values) => {
    setIsLoading(true);
    let data = {};
    if (values.category === 'testimonial') {
      data = { rating, consent: checked };
    }

    const requestBody: CreateContactMessageRequest = {
      email: `${user?.primaryEmailAddress?.emailAddress}`,
      name: `${user?.firstName} ${user?.lastName}`,
      message: values.message,
      token: turnstileToken!,
      category: values.category,
      data,
    };
    contactUsMutation.mutateAsync(requestBody);
    setTimeout(() => {
      form.reset();
      setIsLoading(false);
      setStatus({
        type: 'Success',
        message: "Message sent successfully! We'll get back to you soon.",
      });
    }, 250);
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

  const isTestimonial = form.values.category === 'testimonial';

  return (
    <div className={baseClasses.card}>
      <div className={classes.container}>
        <header className={classes.header}>
          <div className={classes.headerDecoration} />
          <p className={classes.greeting}>Get in touch</p>
          <h1 className={classes.title}>We'd love to hear from you</h1>
          <p className={classes.subtitle}>
            If you have feedback, an idea, or simply want to get in touch, we’re listening.
          </p>
        </header>

        <form
          className={classes.form}
          onSubmit={form.onSubmit((values) => handleContactUsSubmission(values))}
        >
          {status.type && (
            <Alert
              variant="light"
              color="green"
              radius="md"
              title={status.type}
              icon={<IconCheck size={18} />}
              className={classes.successAlert}
              withCloseButton
              onClose={() => setStatus({ type: '', message: '' })}
            >
              {status.message}
            </Alert>
          )}

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
              sitekey={import.meta.env.VITE_CLOUDFLARE_SITEKEY || '1x00000000000000000000AA'}
              onVerify={(token) => setTurnstileToken(token)}
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
                disabled={isLoading || status.type !== ''}
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
