import { Avatar } from '@mantine/core';

interface SubscriberAvatarProps {
  subscriberId: string;
  firstName: string;
  lastName: string;
}

const AVATAR_COLORS = [
  'pink',
  'grape',
  'violet',
  'indigo',
  'blue',
  'cyan',
  'teal',
  'green',
  'lime',
  'orange',
] as const;

function getColorFromId(id: string): (typeof AVATAR_COLORS)[number] {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function getInitials(firstName: string, lastName: string): string {
  const first = firstName.trim()[0]?.toUpperCase() || '';
  const last = lastName.trim()[0]?.toUpperCase() || '';
  return first + last || '?';
}

export function SubscriberAvatar({ subscriberId, firstName, lastName }: SubscriberAvatarProps) {
  const color = getColorFromId(subscriberId);
  const initials = getInitials(firstName, lastName);

  return (
    <Avatar radius="xl" color={color}>
      {initials}
    </Avatar>
  );
}
