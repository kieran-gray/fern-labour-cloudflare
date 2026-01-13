import { Badge, Group, Text } from '@mantine/core';
import classes from './LabourUpdate.module.css';

export interface LabourUpdateProps {
  id: string;
  sentTime: string;
  type: 'status' | 'announcement' | 'private';
  badgeColor: string;
  badgeText: string;
  text: string;
  visibility?: string;
  showFooter?: boolean;
}

export function LabourUpdate({ data }: { data: LabourUpdateProps }) {
  const getPanelClass = (type: string) => {
    switch (type) {
      case 'status':
        return classes.statusUpdatePanel;
      case 'announcement':
        return classes.announcementPanel;
      case 'private':
        return classes.privateNotePanel;
      default:
        return classes.statusUpdatePanel;
    }
  };

  return (
    <div className={getPanelClass(data.type)}>
      <Group justify="space-between">
        <Badge
          variant="light"
          size="sm"
          radius="sm"
          color={data.badgeColor}
          style={{ textTransform: 'lowercase' }}
        >
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
        </div>
      )}
    </div>
  );
}
