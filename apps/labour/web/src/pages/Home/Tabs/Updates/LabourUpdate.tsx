import { Badge, Group, LoadingOverlay, Text } from '@mantine/core';
import { ManageLabourUpdateMenu } from './ManageLabourUpdateMenu';
import classes from './LabourUpdates.module.css';

export interface LabourUpdateProps {
  id: string;
  sentTime: string;
  class: string;
  badgeColor: string;
  badgeText: string;
  text: string;
  visibility: string;
  showMenu: boolean;
  showFooter: boolean;
}

export function LabourUpdate({ data }: { data: LabourUpdateProps }) {
  return (
    <div className={data.class}>
      <LoadingOverlay visible={data.id === 'placeholder'} />
      <Group justify="space-between">
        <Badge variant="light" size="sm" radius="sm" color={data.badgeColor}>
          {data.badgeText}
        </Badge>
        <Text size="xs" c="light-dark(var(--mantine-color-gray-6), var(--mantine-color-gray-5))">
          {data.sentTime}
        </Text>
      </Group>
      <Text pt="sm" size="sm" lh={1.5} style={{ whiteSpace: 'pre-line' }}>
        {data.text}
      </Text>
      {data.showFooter && (
        <div className={classes.messageFooter}>
          <Text size="xs">{data?.visibility}</Text>
          {data.showMenu && (
            <ManageLabourUpdateMenu statusUpdateId={data.id} currentMessage={data.text} />
          )}
        </div>
      )}
    </div>
  );
}
