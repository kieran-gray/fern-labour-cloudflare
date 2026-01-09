import { useMemo } from 'react';
import { ContractionReadModel } from '@base/clients/labour_service';
import { Badge, Group, List, Modal, Stack, Text } from '@mantine/core';
import { LabourStatisticsChart } from './LabourStatisticsChart';
import modalClasses from '@styles/modal.module.css';

type CloseFunctionType = (...args: unknown[]) => void;

function generateMockContractions(): ContractionReadModel[] {
  const now = new Date();
  const contractions: ContractionReadModel[] = [];

  const pattern = [
    { minutesAgo: 152, duration: 34, intensity: 2 },
    { minutesAgo: 138, duration: 31, intensity: 2 },
    { minutesAgo: 124, duration: 36, intensity: 3 },
    { minutesAgo: 111, duration: 33, intensity: 2 },
    { minutesAgo: 96, duration: 38, intensity: 3 },
    { minutesAgo: 82, duration: 41, intensity: 3 },
    { minutesAgo: 70, duration: 39, intensity: 3 },
    { minutesAgo: 56, duration: 44, intensity: 4 },
    { minutesAgo: 43, duration: 42, intensity: 3 },
    { minutesAgo: 31, duration: 47, intensity: 4 },
    { minutesAgo: 20, duration: 45, intensity: 4 },
    { minutesAgo: 9, duration: 52, intensity: 5 },
  ];
  pattern.forEach((p, index) => {
    const startTime = new Date(now.getTime() - p.minutesAgo * 60 * 1000);
    const endTime = new Date(startTime.getTime() + p.duration * 1000);

    contractions.push({
      labour_id: 'mock-labour-id',
      contraction_id: `mock-contraction-${index}`,
      duration: {
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
      },
      duration_seconds: p.duration,
      intensity: p.intensity,
      created_at: startTime.toISOString(),
      updated_at: startTime.toISOString(),
    });
  });

  return contractions;
}

export const StatisticsHelpModal = ({
  opened,
  close,
}: {
  opened: boolean;
  close: CloseFunctionType;
}) => {
  const mockContractions = useMemo(() => generateMockContractions(), []);
  const mockEndTime = useMemo(() => new Date(), []);

  return (
    <Modal
      opened={opened}
      onClose={close}
      title="Statistics Guide"
      size="xl"
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

        {/* Interactive Chart Example */}
        <div className={modalClasses.helpSection}>
          <Text className={modalClasses.helpSectionTitle}>Example Chart</Text>
          <Text className={modalClasses.helpText} mb="sm">
            This interactive example shows how contractions progress during labour. Tap any dot to
            see details.
          </Text>
          <LabourStatisticsChart
            contractions={mockContractions}
            minutes={60}
            endTime={mockEndTime}
          />
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
          </Stack>
          <Text className={modalClasses.helpText} mt="sm" size="xs">
            Dashed red lines mark 1-minute intervals to help gauge duration at a glance.
          </Text>
        </div>

        {/* Key metrics */}
        <div className={modalClasses.helpSection}>
          <Text className={modalClasses.helpSectionTitle}>Key metrics</Text>
          <List className={modalClasses.helpList} size="xs" withPadding spacing="xs">
            <List.Item>
              <strong>Count</strong> — Number of contractions tracked
            </List.Item>
            <List.Item>
              <strong>Duration</strong> — Length of each contraction
            </List.Item>
            <List.Item>
              <strong>Frequency</strong> — Time between contraction starts
            </List.Item>
            <List.Item>
              <strong>Intensity</strong> — Strength (0-10 scale)
            </List.Item>
          </List>
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
