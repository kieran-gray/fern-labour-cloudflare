import { ContractionReadModel } from '@base/clients/labour_service/types';
import { Group, Modal, Stack, Text } from '@mantine/core';
import ContractionTimelineCustom from './ContractionTimelineCustom';
import classes from './HistoryModal.module.css';
import modalClasses from '@styles/modal.module.css';

interface HistoryModalProps {
  opened: boolean;
  onClose: () => void;
  contractions: ContractionReadModel[];
  completed: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

export function HistoryModal({
  opened,
  onClose,
  contractions,
  completed,
  hasMore,
  onLoadMore,
  isLoadingMore,
}: HistoryModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Contraction history"
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
        <div className={modalClasses.helpSection}>
          <div className={classes.content}>
            {contractions.length > 0 ? (
              <ContractionTimelineCustom
                contractions={contractions}
                completed={completed}
                hasMore={hasMore}
                onLoadMore={onLoadMore}
                isLoadingMore={isLoadingMore}
              />
            ) : (
              <Group justify="center" py="xl">
                <Text className={modalClasses.helpText}>No contractions recorded yet</Text>
              </Group>
            )}
          </div>
        </div>
      </Stack>
    </Modal>
  );
}
