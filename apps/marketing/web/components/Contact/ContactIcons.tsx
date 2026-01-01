import { IconAt, IconBrandInstagram } from '@tabler/icons-react';
import { ActionIcon, Box, Stack, Text } from '@mantine/core';
import classes from './ContactIcons.module.css';

interface ContactIconProps extends Omit<React.ComponentPropsWithoutRef<'div'>, 'title'> {
  icon: typeof IconAt;
  title: React.ReactNode;
  description: React.ReactNode;
  link: string | null | undefined;
}

function ContactIcon({ icon: Icon, title, description, link, ...others }: ContactIconProps) {
  return (
    <div className={classes.wrapper} {...others}>
      <Box mr="md">
        {(link != null && (
          <ActionIcon
            target="_blank"
            component="a"
            href={link}
            size={28}
            className={classes.social}
            variant="transparent"
          >
            <Icon size={24} color="var(--mantine-color-gray-8)" />
          </ActionIcon>
        )) || <Icon size={24} color="var(--mantine-color-gray-8)" />}
      </Box>

      <div>
        <Text size="xs" className={classes.title}>
          {title}
        </Text>
        <Text className={classes.description}>{description}</Text>
      </div>
    </div>
  );
}

const data = [
  { title: 'Email', description: 'support@fernlabour.com', icon: IconAt, link: undefined },
  {
    title: 'Instagram',
    description: 'fernlabour',
    icon: IconBrandInstagram,
    link: process.env.NEXT_PUBLIC_INSTAGRAM_URL,
  },
];

export function ContactIconsList() {
  const items = data.map((item, index) => <ContactIcon key={index} {...item} />);
  return <Stack>{items}</Stack>;
}
