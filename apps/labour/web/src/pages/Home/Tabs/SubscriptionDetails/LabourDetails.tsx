import { LabourReadModel } from '@base/clients/labour_service';
import { Card } from '@base/components/Cards/Card';
import { dueDateToGestationalAge } from '@lib';
import { Badge, Group, Card as MantineCard, Text } from '@mantine/core';
import meditateImage from '../ManageLabour/Meditate.svg';
import classes from '../ManageLabour/Manage.module.css';
import baseClasses from '@styles/base.module.css';

interface SubscriberLabourDetailsProps {
  labour: LabourReadModel;
  motherName: string;
}

export function SubscriberLabourDetails({ labour, motherName }: SubscriberLabourDetailsProps) {
  const isCompleted = labour.end_time !== null;

  const currentPhase = isCompleted
    ? 'Completed'
    : labour.current_phase === 'PLANNED'
      ? 'Not in labour'
      : `In ${labour.current_phase} labour`;

  const title = labour.labour_name || `${motherName} Labour`;
  const description = isCompleted
    ? 'The completed labour journey'
    : `${motherName} labour details and progress. You're here to support someone on an incredible journey. Check the app regularly for updates or turn on notifications below to stay informed.`;

  return (
    <div className={baseClasses.root}>
      <Card
        title={title}
        description={description}
        image={{ src: meditateImage, width: 300, height: 280 }}
        mobileImage={{ src: meditateImage, width: 280, height: 200 }}
      >
        <MantineCard padding="md" radius="lg" className={classes.infoCard} mt="md">
          <Group gap="sm" wrap="wrap">
            <Badge size="lg" variant="filled" className={classes.labourBadge}>
              {currentPhase}
            </Badge>
            <Badge size="lg" variant="filled" className={classes.labourBadge}>
              Due: {new Date(labour.due_date).toLocaleDateString()}
            </Badge>
            {!isCompleted && (
              <Badge size="lg" variant="filled" className={classes.labourBadge}>
                {dueDateToGestationalAge(new Date(labour.due_date))}
              </Badge>
            )}
            {isCompleted && labour.end_time && (
              <Badge size="lg" variant="filled" className={classes.labourBadge}>
                Arrived: {new Date(labour.end_time).toLocaleDateString()}
              </Badge>
            )}
          </Group>
        </MantineCard>

        {isCompleted && labour.notes && (
          <MantineCard padding="md" radius="lg" className={classes.noteCard} mt="md">
            <Text size="sm" className={baseClasses.description} mb="xs">
              {motherName} closing note
            </Text>
            <Text>{labour.notes}</Text>
          </MantineCard>
        )}
      </Card>
    </div>
  );
}
