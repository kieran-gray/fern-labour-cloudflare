import { IconEye, IconHeart, IconUsers } from '@tabler/icons-react';
import { Badge } from '@mantine/core';

export enum SubscriberRole {
  BIRTH_PARTNER = 'BIRTH_PARTNER',
  SUPPORT_PERSON = 'SUPPORT_PERSON',
  LOVED_ONE = 'LOVED_ONE',
}

interface RoleBadgeProps {
  role: SubscriberRole;
}

function getRoleConfig(role: SubscriberRole) {
  switch (role) {
    case SubscriberRole.BIRTH_PARTNER:
      return {
        label: 'Birth Partner',
        color: 'pink',
        icon: <IconHeart size={14} />,
      };
    case SubscriberRole.SUPPORT_PERSON:
      return {
        label: 'Support Person',
        color: 'grape',
        icon: <IconEye size={14} />,
      };
    case SubscriberRole.LOVED_ONE:
      return {
        label: 'Loved One',
        color: 'blue',
        icon: <IconUsers size={14} />,
      };
  }
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const config = getRoleConfig(role);

  return (
    <Badge
      color={config.color}
      variant="light"
      leftSection={config.icon}
      size="md"
      radius="sm"
      styles={{
        root: {
          textTransform: 'none',
        },
      }}
    >
      {config.label}
    </Badge>
  );
}
