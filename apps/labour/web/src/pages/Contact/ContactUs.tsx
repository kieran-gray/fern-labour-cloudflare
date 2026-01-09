import { useState } from 'react';
import { useSubmitContactForm } from '@base/hooks/useContactData';
import { useUser } from '@clerk/clerk-react';
import type { CreateContactMessageRequest } from '@clients/contact_service';
import { validateMessage } from '@lib';
import { IconAt, IconBrandInstagram, IconBulb, IconSend } from '@tabler/icons-react';
import { useSearchParams } from 'react-router-dom';
import Turnstile from 'react-turnstile';
import { Checkbox, Rating, Select, Textarea } from '@mantine/core';
import { useForm } from '@mantine/form';
import classes from './ContactUs.module.css';
import baseClasses from '@styles/base.module.css';

const categories = [
  { label: 'An Error Report', value: 'ERROR' },
  { label: 'An Idea', value: 'IDEA' },
  { label: 'A Testimonial', value: 'TESTIMONIAL' },
  { label: 'Other', value: 'OTHER' },
];

export function ContactUs() {
  const { user } = useUser();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [checked, setChecked] = useState(false);

  const [searchParams] = useSearchParams();
  const promptParam = searchParams.get('show');
  const defaultCategory = promptParam ? promptParam : 'ERROR';

  const form = useForm({
    initialValues: {
      category: defaultCategory,
      message: '',
    },
    validate: { message: (message) => validateMessage(message) },
  });

  const contactUsMutation = useSubmitContactForm();
  const handleContactUsSubmission = async (values: typeof form.values) => {
    let data = {};
    if (values.category === 'TESTIMONIAL') {
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
    form.reset();
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
                disabled={contactUsMutation.isPending}
              >
                {contactUsMutation.isPending ? (
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
