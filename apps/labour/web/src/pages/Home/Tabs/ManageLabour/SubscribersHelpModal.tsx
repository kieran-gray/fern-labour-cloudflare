import { SubscriberRole } from '@base/clients/labour_service';
import {
  IconBan,
  IconCheck,
  IconCircleMinus,
  IconDots,
  IconSwitchHorizontal,
  IconX,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Avatar,
  Card,
  Group,
  List,
  Menu,
  Modal,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { RoleBadge } from './RoleBadge';
import subscribersClasses from './SubscribersTable.module.css';
import baseClasses from '@styles/base.module.css';
import modalClasses from '@styles/modal.module.css';

type CloseFunctionType = (...args: any[]) => void;

function MockSubscriberCard({
  name,
  initials,
  color,
  role,
  status,
}: {
  name: string;
  initials: string;
  color: string;
  role?: SubscriberRole;
  status: 'requested' | 'subscribed' | 'blocked';
}) {
  return (
    <Card padding="md" radius="lg" className={subscribersClasses.card}>
      <Group justify="space-between" wrap="nowrap">
        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
          <Avatar radius="xl" color={color}>
            {initials}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <Text fw={500} className={subscribersClasses.cropText} size="sm">
              {name}
            </Text>
            {status === 'subscribed' && role && <RoleBadge role={role} />}
          </div>
        </Group>

        {status === 'requested' && (
          <Group gap="xs" wrap="nowrap">
            <Tooltip label="Accept">
              <ActionIcon variant="light" color="green" size="lg" radius="xl">
                <IconCheck size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Reject">
              <ActionIcon variant="light" color="red" size="lg" radius="xl">
                <IconX size={18} />
              </ActionIcon>
            </Tooltip>
            <Menu transitionProps={{ transition: 'pop' }} withArrow position="bottom">
              <Menu.Target>
                <ActionIcon variant="subtle" className={baseClasses.actionMenuIcon}>
                  <IconDots size={16} stroke={1.5} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown className={baseClasses.actionMenuDropdown}>
                <Menu.Item
                  className={baseClasses.actionMenuDanger}
                  leftSection={<IconBan size={20} stroke={1.5} />}
                >
                  Block
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        )}

        {status === 'blocked' && (
          <Tooltip label="Unblock">
            <ActionIcon variant="light" color="green" size="lg" radius="xl">
              <IconBan size={18} />
            </ActionIcon>
          </Tooltip>
        )}

        {status === 'subscribed' && (
          <Menu transitionProps={{ transition: 'pop' }} withArrow position="bottom">
            <Menu.Target>
              <ActionIcon variant="subtle" className={baseClasses.actionMenuIcon}>
                <IconDots size={16} stroke={1.5} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown className={baseClasses.actionMenuDropdown}>
              <Menu.Item
                className={baseClasses.actionMenuDefault}
                leftSection={<IconSwitchHorizontal size={20} stroke={1.5} />}
              >
                Change role
              </Menu.Item>
              <Menu.Item
                className={baseClasses.actionMenuDanger}
                leftSection={<IconCircleMinus size={20} stroke={1.5} />}
              >
                Remove
              </Menu.Item>
              <Menu.Item
                className={baseClasses.actionMenuDanger}
                leftSection={<IconBan size={20} stroke={1.5} />}
              >
                Block
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>
    </Card>
  );
}

export const SubscribersHelpModal = ({
  opened,
  close,
}: {
  opened: boolean;
  close: CloseFunctionType;
}) => {
  return (
    <Modal
      opened={opened}
      onClose={close}
      title="Managing subscribers"
      size="lg"
      transitionProps={{ transition: 'slide-left' }}
      overlayProps={{ backgroundOpacity: 0.4, blur: 3 }}
      classNames={{
        content: modalClasses.helpModalRoot,
        header: modalClasses.modalHeader,
        title: modalClasses.modalTitle,
        body: modalClasses.modalBody,
        close: modalClasses.closeButton,
      }}
    >
      <Stack gap="md">
        <Text className={modalClasses.helpText}>
          Control who can follow your labour journey. When someone uses your invite link, they'll
          appear in your requests for approval.
        </Text>

        {/* Requests */}
        <div className={modalClasses.helpSection}>
          <Text className={modalClasses.helpSectionTitle}>Requests tab</Text>
          <Text className={modalClasses.helpText} size="sm" mb="sm">
            People waiting for your approval appear here. Accept to let them follow your labour, or
            reject to deny access (they can request again).
          </Text>
          <MockSubscriberCard name="Sarah Johnson" initials="SJ" color="pink" status="requested" />
        </div>

        {/* Active subscribers */}
        <div className={modalClasses.helpSection}>
          <Text className={modalClasses.helpSectionTitle}>Active tab</Text>
          <Text className={modalClasses.helpText} size="sm" mb="sm">
            Approved subscribers appear here with their role. Tap the menu to change their role,
            remove access, or block them.
          </Text>
          <Stack gap="xs">
            <MockSubscriberCard
              name="Emma Wilson"
              initials="EW"
              color="grape"
              role={SubscriberRole.BIRTH_PARTNER}
              status="subscribed"
            />
            <MockSubscriberCard
              name="James Smith"
              initials="JS"
              color="blue"
              role={SubscriberRole.LOVED_ONE}
              status="subscribed"
            />
          </Stack>
        </div>

        {/* Blocked */}
        <div className={modalClasses.helpSection}>
          <Text className={modalClasses.helpSectionTitle}>Blocked tab</Text>
          <Text className={modalClasses.helpText} size="sm" mb="sm">
            Blocked people cannot access your labour or request access again. Unblock them if you
            change your mind.
          </Text>
          <MockSubscriberCard name="Alex Brown" initials="AB" color="red" status="blocked" />
        </div>

        {/* Subscriber roles */}
        <div className={modalClasses.helpSection}>
          <Text className={modalClasses.helpSectionTitle}>Subscriber roles</Text>
          <Text className={modalClasses.helpText} size="sm" mb="sm">
            Each subscriber has a role that determines what they can see and do. Use the menu to
            change roles.
          </Text>
          <Stack gap="sm">
            <div>
              <RoleBadge role={SubscriberRole.LOVED_ONE} />
              <List className={modalClasses.helpList} size="xs" withPadding spacing={2} mt={4}>
                <List.Item>View labour details and due date</List.Item>
                <List.Item>View labour updates and announcements</List.Item>
              </List>
            </div>
            <div>
              <RoleBadge role={SubscriberRole.SUPPORT_PERSON} />
              <List className={modalClasses.helpList} size="xs" withPadding spacing={2} mt={4}>
                <List.Item>Everything a Loved One can do</List.Item>
                <List.Item>View contraction statistics and charts</List.Item>
              </List>
            </div>
            <div>
              <RoleBadge role={SubscriberRole.BIRTH_PARTNER} />
              <List className={modalClasses.helpList} size="xs" withPadding spacing={2} mt={4}>
                <List.Item>Everything a Support Person can do</List.Item>
                <List.Item>Track contractions on your behalf</List.Item>
                <List.Item>Send labour updates and announcements for you</List.Item>
              </List>
            </div>
          </Stack>
        </div>
      </Stack>
    </Modal>
  );
};
