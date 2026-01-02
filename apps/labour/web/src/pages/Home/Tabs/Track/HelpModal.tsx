import { ContractionReadModel } from '@base/clients/labour_service';
import { IconHourglassHigh, IconHourglassLow } from '@tabler/icons-react';
import { Anchor, Button, Group, List, Modal, Slider, Space, Stack, Text } from '@mantine/core';
import { CallMidwifeAlert, GoToHospitalAlert, PrepareForHospitalAlert } from './Alerts';
import ContractionTimelineCustom from './ContractionTimelineCustom';
import contractionClasses from './Contractions.module.css';
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
            <Button leftSection={<IconHourglassLow size={20} />} radius="xl" size="md">
              Start Contraction
            </Button>
            <Button
              leftSection={<IconHourglassHigh size={20} />}
              radius="xl"
              size="md"
              variant="outline"
            >
              End Contraction
            </Button>
          </Stack>
          <Stack align="center" gap="xs" w="100%">
            <Text className={modalClasses.helpText} size="xs">
              Your contraction intensity
            </Text>
            <Slider
              classNames={{
                root: contractionClasses.slider,
                markLabel: contractionClasses.markLabel,
                track: contractionClasses.track,
              }}
              size="md"
              radius="lg"
              w="80%"
              min={0}
              max={10}
              step={1}
              defaultValue={5}
              marks={[
                { value: 0, label: '0' },
                { value: 5, label: '5' },
                { value: 10, label: '10' },
              ]}
            />
          </Stack>
        </div>

        {/* Reading the timeline */}
        <div className={modalClasses.helpSection}>
          <Text className={modalClasses.helpSectionTitle}>Reading the timeline</Text>
          <List className={modalClasses.helpList} size="xs" withPadding spacing={4}>
            <List.Item>Start time of each contraction</List.Item>
            <List.Item>Frequency (time between starts)</List.Item>
            <List.Item>Duration and intensity</List.Item>
          </List>
          <Group justify="center" mt="sm">
            <ContractionTimelineCustom contractions={mockContractions} completed />
          </Group>
          <Text className={modalClasses.helpText} size="xs" mt="sm">
            Tap any contraction to edit or delete it.
          </Text>
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
