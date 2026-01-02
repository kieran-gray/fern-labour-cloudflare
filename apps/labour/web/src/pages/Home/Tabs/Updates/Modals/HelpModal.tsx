import { List, Modal, Space, Stack, Text } from '@mantine/core';
import { LabourUpdate, LabourUpdateProps } from '../LabourUpdate';
import labourUpdateClasses from '../LabourUpdates.module.css';
import modalClasses from '@styles/modal.module.css';

type CloseFunctionType = (...args: any[]) => void;

export const LabourUpdatesHelpModal = ({
  opened,
  close,
}: {
  opened: boolean;
  close: CloseFunctionType;
}) => {
  const sentTime = new Date().toLocaleString().slice(0, 17).replace(',', ' at');
  const mockStatusUpdate: LabourUpdateProps = {
    id: 'mock-status-update',
    sentTime,
    class: labourUpdateClasses.statusUpdatePanel,
    badgeColor: '#24968b',
    badgeText: 'status',
    text: "This is a status update, use me to make less important/urgent updates or just to say 'No, the baby is not here yet'",
    visibility: 'Visible to subscribers',
    showMenu: true,
    showFooter: true,
  };
  const mockAnnouncement: LabourUpdateProps = {
    id: 'mock-status-update',
    sentTime,
    class: labourUpdateClasses.announcementPanel,
    badgeColor: 'var(--mantine-primary-color-6)',
    badgeText: 'announcement',
    text: 'This is an announcement, use me to make more important updates',
    visibility: 'Broadcast to subscribers',
    showMenu: false,
    showFooter: true,
  };
  const mockLabourBegun: LabourUpdateProps = {
    id: 'mock-status-update',
    sentTime,
    class: labourUpdateClasses.privateNotePanel,
    badgeColor: '#ff8f00',
    badgeText: 'Fern Labour',
    text: "You're now tracking contractions! Use the announce button on this message to let your subscribers know that labour has started!",
    visibility: 'Only visible to you',
    showMenu: true,
    showFooter: true,
  };
  return (
    <Modal
      opened={opened}
      onClose={close}
      title="Sharing updates"
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
          Share updates to keep loved ones in the loop. There are two types you can send, plus
          occasional app messages just for you.
        </Text>

        <div className={modalClasses.helpSection}>
          <Text className={modalClasses.helpSectionTitle}>Status updates</Text>
          <List className={modalClasses.helpList} size="xs" withPadding spacing="xs">
            <List.Item>Visible to subscribers inside the app</List.Item>
            <List.Item>No push notifications sent</List.Item>
            <List.Item>Use the menu to edit, share, or delete</List.Item>
          </List>
          <Space h="md" />
          <LabourUpdate data={mockStatusUpdate} />
        </div>

        <div className={modalClasses.helpSection}>
          <Text className={modalClasses.helpSectionTitle}>Announcements</Text>
          <List className={modalClasses.helpList} size="xs" withPadding spacing="xs">
            <List.Item>Broadcast via SMS, WhatsApp, or email</List.Item>
            <List.Item>Best for important updates</List.Item>
          </List>
          <Space h="md" />
          <LabourUpdate data={mockAnnouncement} />
        </div>

        <div className={modalClasses.helpSection}>
          <Text className={modalClasses.helpSectionTitle}>App messages</Text>
          <List className={modalClasses.helpList} size="xs" withPadding spacing="xs">
            <List.Item>Private to you only</List.Item>
            <List.Item>Created automatically at key moments</List.Item>
            <List.Item>Can be shared as an announcement</List.Item>
          </List>
          <Space h="md" />
          <LabourUpdate data={mockLabourBegun} />
        </div>
      </Stack>
    </Modal>
  );
};
