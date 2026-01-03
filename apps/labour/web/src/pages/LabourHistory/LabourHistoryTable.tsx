import { useState } from 'react';
import { GenericConfirmModal } from '@base/components/Modals/GenericConfirmModal';
import { AppMode, useLabourSession } from '@base/contexts/LabourSessionContext';
import { useDeleteLabour, useLabourClient, useLabourHistory } from '@base/hooks';
import { PageLoadingIcon } from '@components/PageLoading/Loading';
import { IconArrowRight, IconCalendar, IconPlus, IconTrash, IconX } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import {
  ActionIcon,
  Avatar,
  Badge,
  Button,
  Card,
  Group,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import classes from './LabourHistoryTable.module.css';
import baseClasses from '@styles/base.module.css';

export function LabourHistoryTable() {
  const { labourId, setLabourId, clearSession, setMode } = useLabourSession();
  const [deleteLabourId, setDeleteLabourId] = useState<string | null>(null);
  const navigate = useNavigate();
  const client = useLabourClient();
  const { isPending, isError, data, error } = useLabourHistory(client);
  const deleteMutation = useDeleteLabour(client);

  const labours = data || [];

  if (isPending) {
    return (
      <div className={classes.loadingContainer}>
        <PageLoadingIcon />
      </div>
    );
  }

  if (isError) {
    return (
      <Text fz={{ base: 'sm', xs: 'md' }} className={baseClasses.importantText}>
        {error.message}
      </Text>
    );
  }

  const sortedLabours = [...labours].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  const handleViewLabour = (selectedLabourId: string) => {
    if (labourId === selectedLabourId) {
      clearSession();
    } else {
      clearSession();
      setMode(AppMode.Birth);
      setLabourId(selectedLabourId);
      navigate(`/?labourId=${selectedLabourId}`);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteLabourId) {
      deleteMutation.mutate(deleteLabourId);
      setDeleteLabourId(null);
      clearSession();
    }
  };

  const formatDateFull = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  if (sortedLabours.length === 0) {
    return (
      <Stack align="center" gap="md" pt="lg">
        <Text size="sm" className={baseClasses.description} ta="center">
          No labours recorded yet. Start tracking your first labour to see it here.
        </Text>
        <Button
          leftSection={<IconPlus size={18} />}
          variant="light"
          radius="xl"
          size="md"
          onClick={() => navigate('/')}
        >
          Start New Labour
        </Button>
      </Stack>
    );
  }

  return (
    <>
      <Stack gap="sm" w="100%">
        {sortedLabours.map((labour) => {
          const isSelected = labourId === labour.labour_id;
          const displayName = labour.labour_name || `Labour ${formatDateShort(labour.created_at)}`;
          const isDeleting = deleteMutation.isPending && deleteLabourId === labour.labour_id;

          return (
            <Card
              key={labour.labour_id}
              padding="md"
              radius="lg"
              className={`${classes.card} ${isSelected ? classes.cardSelected : ''}`}
            >
              <Group justify="space-between" wrap="nowrap" gap="sm">
                {/* Left side: Avatar + Info */}
                <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                  <Avatar
                    radius="xl"
                    color="var(--mantine-primary-color-5)"
                    className={classes.avatar}
                  >
                    <IconCalendar size={20} />
                  </Avatar>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <Text fw={500} className={classes.cropText} size="sm">
                      {displayName}
                    </Text>
                    <Group gap="xs" mt={4} wrap="nowrap">
                      <Badge variant="light" size="sm" className={classes.badge}>
                        {labour.current_phase}
                      </Badge>
                      <Text size="xs" className={`${baseClasses.description} ${classes.dateFull}`}>
                        {formatDateFull(labour.updated_at)}
                      </Text>
                      <Text size="xs" className={`${baseClasses.description} ${classes.dateShort}`}>
                        {formatDateShort(labour.updated_at)}
                      </Text>
                    </Group>
                  </div>
                </Group>

                {/* Right side: Actions */}
                <Group gap="xs" wrap="nowrap" className={classes.actions}>
                  <Button
                    rightSection={
                      isSelected ? (
                        <IconX size={16} stroke={1.5} />
                      ) : (
                        <IconArrowRight size={16} stroke={1.5} />
                      )
                    }
                    variant={isSelected ? 'filled' : 'light'}
                    radius="xl"
                    size="sm"
                    onClick={() => handleViewLabour(labour.labour_id)}
                    className={classes.viewButtonFull}
                  >
                    {isSelected ? 'Close' : 'View'}
                  </Button>

                  {/* Icon button - visible on smaller screens */}
                  <Tooltip label={isSelected ? 'Close' : 'View'}>
                    <ActionIcon
                      variant={isSelected ? 'filled' : 'light'}
                      radius="xl"
                      size="lg"
                      onClick={() => handleViewLabour(labour.labour_id)}
                      className={classes.viewButtonCompact}
                    >
                      {isSelected ? <IconX size={18} /> : <IconArrowRight size={18} />}
                    </ActionIcon>
                  </Tooltip>

                  <Tooltip label="Delete">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="lg"
                      radius="xl"
                      loading={isDeleting}
                      onClick={() => setDeleteLabourId(labour.labour_id)}
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
            </Card>
          );
        })}
      </Stack>

      <GenericConfirmModal
        isOpen={deleteLabourId !== null}
        title="Delete Labour?"
        confirmText="Delete"
        message="This will permanently delete this labour record and all associated data. This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteLabourId(null)}
        isDangerous
      />
    </>
  );
}
