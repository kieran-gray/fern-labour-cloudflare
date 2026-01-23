import { ContractionReadModel } from '@base/clients/labour_service';
import { IconClock, IconFlame, IconHourglassHigh, IconHourglassLow } from '@tabler/icons-react';
import { Anchor, Button, Group, List, Modal, Slider, Space, Stack, Text } from '@mantine/core';
import { CallMidwifeAlert, GoToHospitalAlert, PrepareForHospitalAlert } from '../Components/Alerts';
import ContractionTimelineCustom from '../Components/Timeline/ContractionTimelineCustom';
import contractionControlClasses from '../Components/Controls/ActiveContractionControls.module.css';
import statsClasses from '../Components/Stats/ContractionStats.module.css';
import statusCardClasses from '../Components/Controls/TrackingStatusCard.module.css';
import modalClasses from '@styles/modal.module.css';

type CloseFunctionType = (...args: any[]) => void;

export const ContractionsHelpModal = ({
  opened,
  close,
}: {
  opened: boolean;
  close: CloseFunctionType;
}) => {
  const now = new Date();
  const mockContractions: ContractionReadModel[] = [
    {
      contraction_id: 'mock-contraction-1',
      labour_id: 'mock-labour-id',
      duration: {
        start_time: new Date(now.getTime() - 300 * 1000).toISOString(),
        end_time: new Date(now.getTime() - 229 * 1000).toISOString(),
      },
      duration_seconds: 71,
      intensity: 3,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    },
    {
      contraction_id: 'mock-contraction-2',
      labour_id: 'mock-labour-id',
      duration: {
        start_time: new Date(now.getTime() - 44 * 1000).toISOString(),
        end_time: now.toISOString(),
      },
      duration_seconds: 44,
      intensity: 2,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    },
  ];

  return (
    <Modal
      opened={opened}
      onClose={close}
      title="Contraction tracker guide"
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
        {/* How to track */}
        <div className={modalClasses.helpSection}>
          <Text className={modalClasses.helpSectionTitle}>How to track</Text>
          <Text className={modalClasses.helpText} mb="sm">
            Track contractions with two taps. You can also set the intensity while timing.
          </Text>
          <Stack align="center" gap="sm" mb="sm">
            <Button
              leftSection={<IconHourglassLow size={20} />}
              radius="xl"
              size="md"
              style={{ width: '80%' }}
            >
              Start Contraction
            </Button>
            <Button
              leftSection={<IconHourglassHigh size={20} />}
              radius="xl"
              size="md"
              variant="outline"
              style={{ width: '80%' }}
            >
              End Contraction
            </Button>
          </Stack>
          <Stack align="center" gap="xs" w="100%">
            <Text
              className={contractionControlClasses.sectionLabel}
              style={{ marginBottom: '0px', padding: '0px' }}
            >
              Intensity
            </Text>
            <Slider
              classNames={{
                root: contractionControlClasses.slider,
                markLabel: contractionControlClasses.markLabel,
                track: contractionControlClasses.track,
                bar: contractionControlClasses.bar,
                thumb: contractionControlClasses.thumb,
              }}
              size="md"
              radius="lg"
              w="80%"
              min={0}
              max={10}
              step={1}
              defaultValue={5}
              marks={[
                { value: 0, label: 'mild' },
                { value: 5, label: 'moderate' },
                { value: 10, label: 'strong' },
              ]}
            />
          </Stack>
        </div>

        {/* Stats and chart */}
        <div className={modalClasses.helpSection}>
          <Text className={modalClasses.helpSectionTitle}>Your stats</Text>
          <Text className={modalClasses.helpText} mb="sm">
            Once tracking begins, you'll see live statistics based on your last few contractions:
          </Text>

          {/* Example stat cards */}
          <div
            className={statsClasses.statCardsContainer}
            style={{ marginBottom: 'var(--mantine-spacing-md)' }}
          >
            <div className={statsClasses.statCard}>
              <Text className={statsClasses.statCardLabel}>
                <IconClock size={14} />
                Frequency
              </Text>
              <Text className={statsClasses.statCardValue}>~4m 15s</Text>
              <Text className={statsClasses.statCardSubtext}>apart (last 4)</Text>
            </div>
            <div className={statsClasses.statCard}>
              <Text className={statsClasses.statCardLabel}>
                <IconFlame size={14} />
                Duration
              </Text>
              <Text className={statsClasses.statCardValue}>~58s</Text>
              <Text className={statsClasses.statCardSubtext}>average (last 4)</Text>
            </div>
          </div>

          <Text className={modalClasses.helpText} size="xs">
            A bar chart shows your recent contractions. Tap any bar to edit or delete it.
          </Text>
        </div>

        {/* During a contraction */}
        <div className={modalClasses.helpSection}>
          <Text className={modalClasses.helpSectionTitle}>During a contraction</Text>
          <Text className={modalClasses.helpText} mb="sm">
            When you start a contraction, you'll see a live stopwatch counting the duration.
          </Text>

          {/* Example stopwatch display */}
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--mantine-spacing-lg)',
              marginBottom: 'var(--mantine-spacing-md)',
              background: 'light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-2))',
              borderRadius: 'var(--mantine-radius-lg)',
              border:
                '1px solid light-dark(var(--mantine-color-pink-3), var(--mantine-color-pink-7))',
            }}
          >
            <Text className={statusCardClasses.activeLabel}>Contraction in progress</Text>
            <Text
              style={{
                fontSize: '2.5rem',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                color: 'light-dark(var(--mantine-color-gray-7), var(--mantine-color-gray-1))',
                padding: 'var(--mantine-spacing-md) 0',
              }}
            >
              0:47
            </Text>
            <Text className={statusCardClasses.breathingPrompt}>Breathe slowly and steadily</Text>
          </div>

          <Text className={modalClasses.helpText} size="xs">
            Between contractions, the app shows your last contraction time and encouraging messages.
          </Text>
        </div>

        {/* Viewing history */}
        <div className={modalClasses.helpSection}>
          <Text className={modalClasses.helpSectionTitle}>Viewing full history</Text>
          <Text className={modalClasses.helpText} mb="sm">
            Tap "View history" to see a complete timeline of all your contractions. You can tap any
            contraction in the timeline to edit its start time, end time, or intensity.
          </Text>
          <Group justify="center" mt="sm">
            <ContractionTimelineCustom contractions={mockContractions} completed />
          </Group>
        </div>

        {/* Hospital alerts */}
        <div className={modalClasses.helpSection}>
          <Text className={modalClasses.helpSectionTitle}>Hospital alerts</Text>
          <Text className={modalClasses.helpText} mb="sm">
            The app monitors your pattern and alerts you when it's time to prepare or go.
          </Text>

          <Stack gap="xs">
            <div>
              <Text className={modalClasses.helpText} fw={500} mb={4}>
                First-time mothers (3-1-1 rule)
              </Text>
              <List className={modalClasses.helpList} size="xs" withPadding spacing={2}>
                <List.Item>Prepare: 4 contractions, 3 min apart, 1 min each</List.Item>
                <List.Item>Go: pattern holds for 1 hour</List.Item>
              </List>
            </div>

            <div>
              <Text className={modalClasses.helpText} fw={500} mb={4}>
                Have given birth before (5-1-1 rule)
              </Text>
              <List className={modalClasses.helpList} size="xs" withPadding spacing={2}>
                <List.Item>Prepare: 4 contractions, 5 min apart, 1 min each</List.Item>
                <List.Item>Go: pattern holds for 1 hour</List.Item>
              </List>
            </div>
          </Stack>

          <Stack gap="xs" mt="sm">
            <PrepareForHospitalAlert onClose={() => {}} />
            <GoToHospitalAlert onClose={() => {}} />
          </Stack>
        </div>

        {/* When to call */}
        <div className={modalClasses.helpSection}>
          <Text className={modalClasses.helpSectionTitle}>When to call your midwife</Text>

          <Text className={modalClasses.helpText} fw={500} mb={4}>
            Call for guidance if:
          </Text>
          <List className={modalClasses.helpList} size="xs" withPadding spacing={2} mb="sm">
            <List.Item>You think you're in labour</List.Item>
            <List.Item>Contractions are 5 minutes apart or less</List.Item>
            <List.Item>You're worried about anything</List.Item>
          </List>

          <Text className={modalClasses.helpText} fw={500} mb={4}>
            Call urgently if:
          </Text>
          <List className={modalClasses.helpList} size="xs" withPadding spacing={2}>
            <List.Item>Your waters break</List.Item>
            <List.Item>Vaginal bleeding</List.Item>
            <List.Item>Baby moving less than usual</List.Item>
            <List.Item>Under 37 weeks and may be in labour</List.Item>
            <List.Item>Any contraction lasts over 2 minutes</List.Item>
            <List.Item>6+ contractions every 10 minutes</List.Item>
          </List>
          <Space h="md" />
          <CallMidwifeAlert onClose={() => {}} />

          <Anchor
            href="https://www.nhs.uk/pregnancy/labour-and-birth/what-happens/the-stages-of-labour-and-birth/"
            target="_blank"
            size="xs"
            mt="xs"
          >
            More info on the NHS website
          </Anchor>
        </div>

        {/* Disclaimer */}
        <Text className={modalClasses.helpText} size="xs" ta="center">
          Fern Labour does not provide medical advice. Always consult your healthcare provider.
        </Text>
      </Stack>
    </Modal>
  );
};
