import { useState } from 'react';
import { ContractionReadModel, LabourReadModel } from '@base/clients/labour_service';
import { GenericConfirmModal } from '@base/components/Modals/GenericConfirmModal';
import { useLabourSession } from '@base/contexts/LabourSessionContext';
import { useCompleteLabour, useLabourClient } from '@base/hooks';
import { dueDateToGestationalAge } from '@lib';
import { IconConfetti, IconEdit, IconPencil } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Stack,
  Text,
  Textarea,
  Title,
  Tooltip,
} from '@mantine/core';
import { EditLabourModal } from './EditLabourModal';
import classes from './Manage.module.css';
import baseClasses from '@styles/base.module.css';

export function LabourDetails({
  activeContraction,
  labour,
}: {
  activeContraction: ContractionReadModel | undefined;
  labour: LabourReadModel | undefined;
}) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [labourNotes, setLabourNotes] = useState('');
  const navigate = useNavigate();

  const client = useLabourClient();
  const completeLabourMutation = useCompleteLabour(client);
  const { labourId, clearSession } = useLabourSession();

  if (!labour) {
    return null;
  }

  const isCompleted = labour.end_time !== null;
  const hasActiveContraction = activeContraction !== undefined;

  const currentPhase = isCompleted
    ? 'Completed'
    : labour.current_phase === 'PLANNED'
      ? 'Not in labour'
      : `In ${labour.current_phase} labour`;

  const title = labour.labour_name || 'Your Labour';
  const subtitle = isCompleted
    ? "Welcome back! You're viewing your completed labour journey."
    : 'Manage your labour details';

  const handleCompleteLabour = () => {
    setIsCompleteModalOpen(false);
    completeLabourMutation.mutate(
      {
        labourId: labourId!,
        notes: labourNotes,
      },
      {
        onSuccess: () => {
          clearSession();
          navigate('/completed');
        },
      }
    );
  };

  return (
    <div className={baseClasses.root}>
      <div className={baseClasses.body}>
        <Stack gap="lg" p="md">
          {/* Header */}
          <Group justify="space-between" align="flex-start">
            <div>
              <Title order={2} className={classes.title}>
                {title}
              </Title>
              <Text size="sm" className={baseClasses.description} mt={4}>
                {subtitle}
              </Text>
            </div>
            {!isCompleted && (
              <Button
                variant="light"
                leftSection={<IconEdit size={16} />}
                radius="xl"
                onClick={() => setIsEditModalOpen(true)}
              >
                Edit
              </Button>
            )}
          </Group>

          {/* Info Badges */}
          <Card padding="md" radius="lg" className={classes.infoCard}>
            <Group gap="sm" wrap="wrap">
              <Badge size="lg" variant="filled" className={classes.labourBadge}>
                {currentPhase}
              </Badge>
              <Badge size="lg" variant="filled" className={classes.labourBadge}>
                Due: {new Date(labour.due_date).toLocaleDateString()}
              </Badge>
              {!isCompleted && (
                <Badge size="lg" variant="filled" className={classes.labourBadge}>
                  {dueDateToGestationalAge(new Date(labour.due_date))}
                </Badge>
              )}
              {isCompleted && labour.end_time && (
                <Badge size="lg" variant="filled" className={classes.labourBadge}>
                  Arrived: {new Date(labour.end_time).toLocaleDateString()}
                </Badge>
              )}
              <Badge size="lg" variant="filled" className={classes.labourBadge}>
                {labour.first_labour ? 'First baby' : 'Not first baby'}
              </Badge>
            </Group>
          </Card>

          {/* Closing Note (if completed) */}
          {isCompleted && labour.notes && (
            <Card padding="md" radius="lg" className={classes.noteCard}>
              <Text size="sm" className={baseClasses.description} mb="xs">
                Your closing note
              </Text>
              <Text>{labour.notes}</Text>
            </Card>
          )}

          {/* Complete Labour Section */}
          {!isCompleted && (
            <>
              <Divider my="sm" />

              <div>
                <Title order={2} fz={{ base: 'h4', xs: 'h3', sm: 'h2' }}>
                  Ready to complete your labour?
                </Title>
                <Text fz={{ base: 'sm', sm: 'md' }} className={baseClasses.description} mt={14}>
                  Add an optional closing note to share with your subscribers, then mark your labour
                  as complete.
                </Text>
                <Textarea
                  placeholder="Welcome to the world, little one! Everyone is healthy and happy."
                  rightSection={<IconPencil size={16} stroke={1.5} />}
                  radius="md"
                  size="sm"
                  mt="lg"
                  minRows={3}
                  value={labourNotes}
                  onChange={(event) => setLabourNotes(event.currentTarget.value)}
                  classNames={{
                    input: baseClasses.input,
                    section: baseClasses.section,
                  }}
                />

                <Group justify="flex-end" mt="md">
                  {hasActiveContraction ? (
                    <Tooltip label="End your current contraction first">
                      <Button
                        data-disabled
                        leftSection={<IconConfetti size={18} />}
                        size="sm"
                        hiddenFrom="sm"
                        radius="xl"
                        onClick={(e) => e.preventDefault()}
                      >
                        Complete labour
                      </Button>
                      <Button
                        data-disabled
                        leftSection={<IconConfetti size={18} />}
                        size="md"
                        visibleFrom="sm"
                        radius="xl"
                        onClick={(e) => e.preventDefault()}
                      >
                        Complete labour
                      </Button>
                    </Tooltip>
                  ) : (
                    <>
                      <Button
                        leftSection={<IconConfetti size={18} />}
                        size="md"
                        hiddenFrom="sm"
                        radius="xl"
                        onClick={() => setIsCompleteModalOpen(true)}
                        loading={completeLabourMutation.isPending}
                      >
                        Complete labour
                      </Button>
                      <Button
                        leftSection={<IconConfetti size={18} />}
                        size="lg"
                        visibleFrom="sm"
                        radius="xl"
                        onClick={() => setIsCompleteModalOpen(true)}
                        loading={completeLabourMutation.isPending}
                      >
                        Complete labour
                      </Button>
                    </>
                  )}
                </Group>
              </div>
            </>
          )}
        </Stack>
      </div>

      <EditLabourModal
        labour={labour}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
      <GenericConfirmModal
        isOpen={isCompleteModalOpen}
        title="Complete your labour?"
        confirmText="Yes, complete"
        message="This will mark your labour as complete and notify your subscribers."
        onConfirm={handleCompleteLabour}
        onCancel={() => setIsCompleteModalOpen(false)}
        isLoading={completeLabourMutation.isPending}
        isDangerous
      />
    </div>
  );
}
