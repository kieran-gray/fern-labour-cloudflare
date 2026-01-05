import { useState } from 'react';
import { useLabourSession } from '@base/contexts';
import { useLabourClient, useSendLabourInvite } from '@base/hooks';
import { Card } from '@components/Cards/Card';
import { validateEmail } from '@lib';
import { IconAt, IconSend } from '@tabler/icons-react';
import { Button, Group, Pill, PillsInput } from '@mantine/core';
import image from './invite.svg';
import classes from './InviteByEmail.module.css';
import baseClasses from '@styles/base.module.css';

export function InviteByEmail() {
  const { labourId } = useLabourSession();
  const client = useLabourClient();
  const [emails, setEmails] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const sendInviteMutation = useSendLabourInvite(client);

  const addEmail = (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      return;
    }

    if (!validateEmail(trimmed)) {
      setError('Please enter a valid email address');
      return;
    }

    if (emails.includes(trimmed)) {
      setError('This email has already been added');
      return;
    }

    setEmails([...emails, trimmed]);
    setInputValue('');
    setError(null);
  };

  const removeEmail = (emailToRemove: string) => {
    setEmails(emails.filter((email) => email !== emailToRemove));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',' || event.key === ' ') {
      event.preventDefault();
      addEmail(inputValue);
    } else if (event.key === 'Backspace' && inputValue === '' && emails.length > 0) {
      removeEmail(emails[emails.length - 1]);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addEmail(inputValue);
    }
  };

  const handleSubmit = () => {
    if (emails.length === 0) {
      setError('Please add at least one email address');
      return;
    }

    let successCount = 0;
    const totalEmails = emails.length;

    emails.forEach((email) => {
      sendInviteMutation.mutate(
        {
          email,
          labourId: labourId!,
        },
        {
          onSuccess: () => {
            successCount++;
            if (successCount === totalEmails) {
              setEmails([]);
              setError(null);
            }
          },
        }
      );
    });
  };

  const emailPills = emails.map((email) => (
    <Pill
      key={email}
      withRemoveButton
      onRemove={() => removeEmail(email)}
      removeButtonProps={{ 'aria-label': `Remove ${email}` }}
      classNames={{ root: classes.emailPill, label: classes.emailPillLabel }}
      size="md"
    >
      {email}
    </Pill>
  ));

  return (
    <Card
      title="Send a personal invitation"
      description="We'll send them a warm welcome with instructions on how to follow along. You can invite as many people as you like."
      image={{ src: image, width: 250, height: 220 }}
      imagePosition="left"
      mobileImage={{ src: image, width: 220, height: 200 }}
    >
      <PillsInput
        label="Who would you like to invite?"
        description="Press Enter or comma to add multiple people"
        radius="lg"
        size="lg"
        mt="lg"
        error={error}
        classNames={{
          label: classes.inputLabel,
          description: `${baseClasses.description} ${classes.inputDescription}`,
          input: classes.pillsInput,
          section: baseClasses.section,
        }}
        rightSection={<IconAt size={16} className={baseClasses.section} />}
        rightSectionPointerEvents="none"
      >
        <Pill.Group>
          {emailPills}
          <PillsInput.Field
            placeholder={
              emails.length >= 20
                ? 'Limit reached'
                : emails.length === 0
                  ? 'friend@email.com'
                  : 'Add another...'
            }
            disabled={emails.length >= 20 && !inputValue}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.currentTarget.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
          />
        </Pill.Group>
      </PillsInput>

      <Group justify="end" align="center" mt="lg">
        <Button
          variant="filled"
          rightSection={<IconSend size={18} stroke={1.5} />}
          radius="xl"
          size="md"
          loading={sendInviteMutation.isPending}
          onClick={handleSubmit}
          disabled={emails.length === 0}
        >
          Send {emails.length > 1 ? `${emails.length} invites` : 'invite'}
        </Button>
      </Group>
    </Card>
  );
}
