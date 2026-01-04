import { Badge, Group, List, Modal, Stack, Text } from '@mantine/core';
import modalClasses from '@styles/modal.module.css';

type CloseFunctionType = (...args: unknown[]) => void;

export const StatisticsHelpModal = ({
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
      title="Statistics guide"
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
          Statistics help you understand your contraction patterns. Share these with your midwife or
          healthcare provider to discuss your labour progress.
        </Text>

        {/* Key metrics */}
        <div className={modalClasses.helpSection}>
          <Text className={modalClasses.helpSectionTitle}>Key metrics</Text>
          <List className={modalClasses.helpList} size="xs" withPadding spacing="xs">
            <List.Item>
              <strong>Count</strong> — Total number of contractions tracked
            </List.Item>
            <List.Item>
              <strong>Duration</strong> — Average length of each contraction
            </List.Item>
            <List.Item>
              <strong>Frequency</strong> — Average time between contraction starts
            </List.Item>
            <List.Item>
              <strong>Intensity</strong> — Average strength (0-10 scale)
            </List.Item>
          </List>
        </div>

        {/* Chart explanation */}
        <div className={modalClasses.helpSection}>
          <Text className={modalClasses.helpSectionTitle}>Reading the chart</Text>
          <Text className={modalClasses.helpText} mb="sm">
            Each dot represents a contraction. The vertical position shows duration, and dots are
            colored by intensity:
          </Text>
          <Stack gap="xs">
            <Group gap="sm">
              <Badge color="green" size="sm" circle />
              <Text className={modalClasses.helpText}>Mild (0-3)</Text>
            </Group>
            <Group gap="sm">
              <Badge color="yellow" size="sm" circle />
              <Text className={modalClasses.helpText}>Moderate (4-7)</Text>
            </Group>
            <Group gap="sm">
              <Badge color="red" size="sm" circle />
              <Text className={modalClasses.helpText}>Strong (8-10)</Text>
            </Group>
            <Group gap="sm">
              <Badge color="gray" size="sm" circle />
              <Text className={modalClasses.helpText}>Not recorded</Text>
            </Group>
          </Stack>
          <Text className={modalClasses.helpText} mt="sm" size="xs">
            Tap a dot to see details. Dashed lines mark 1-minute intervals.
          </Text>
        </div>

        {/* Time range */}
        <div className={modalClasses.helpSection}>
          <Text className={modalClasses.helpSectionTitle}>Time range</Text>
          <Text className={modalClasses.helpText}>
            Use the tabs to filter data. "Past 30 Mins" and "Past 60 Mins" are useful during active
            labour. "All" shows your complete history.
          </Text>
        </div>

        {/* Tips */}
        <div className={modalClasses.helpSection}>
          <Text className={modalClasses.helpSectionTitle}>What to look for</Text>
          <List className={modalClasses.helpList} size="xs" withPadding spacing="xs">
            <List.Item>Contractions getting longer (dots moving up)</List.Item>
            <List.Item>Contractions getting closer together (dots clustering)</List.Item>
            <List.Item>Contractions getting stronger (more red/yellow dots)</List.Item>
          </List>
          <Text className={modalClasses.helpText} mt="sm" size="xs">
            These patterns typically indicate labour is progressing.
          </Text>
        </div>
      </Stack>
    </Modal>
  );
};
