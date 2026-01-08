import { useState } from 'react';
import { ContractionReadModel, LabourReadModel } from '@base/clients/labour_service';
import { GenericConfirmModal } from '@base/components/Modals/GenericConfirmModal';
import { useLabourSession } from '@base/contexts/LabourSessionContext';
import { useCompleteLabour, useLabourClient } from '@base/hooks';
import { dueDateToGestationalAge } from '@lib';
import {
  IconActivityHeartbeat,
  IconBabyCarriage,
  IconCalendarEvent,
  IconConfetti,
  IconEdit,
  IconPencil,
  IconStethoscope,
  IconUserHeart,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { Button, Text, Textarea, Title, Tooltip } from '@mantine/core';
import { EditLabourModal } from './EditLabourModal';
import classes from './Manage.module.css';
import baseClasses from '@styles/base.module.css';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
}

const StatCard = ({ icon, label, value, subtext }: StatCardProps) => (
  <div className={classes.statCard}>
    <Text className={classes.statCardLabel}>
      {icon}
      {label}
    </Text>
    <Text className={classes.statCardValue}>{value}</Text>
    {subtext && <Text className={classes.statCardSubtext}>{subtext}</Text>}
  </div>
);

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
    ? "You're viewing your completed labour journey. We hope everything went well!"
    : 'View and manage your labour details from this control panel.';

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
    <div className={baseClasses.card}>
      <div className={classes.container}>
        {/* Header */}
        <header className={classes.header}>
          <div className={classes.headerDecoration} />
          <h1 className={classes.title}>
            <span className={classes.titleAccent}>{title}</span>
          </h1>
          <p className={classes.subtitle}>{subtitle}</p>
          {!isCompleted && (
            <Button
              variant="light"
              leftSection={<IconEdit size={16} />}
              radius="xl"
              mt="md"
              onClick={() => setIsEditModalOpen(true)}
            >
              Edit details
            </Button>
          )}
        </header>

        {/* Stat Cards */}
        <div className={classes.statCardsContainer}>
          <StatCard
            icon={<IconCalendarEvent size={14} />}
            label="Due date"
            value={new Date(labour.due_date).toLocaleDateString()}
          />
          {!isCompleted && (
            <StatCard
              icon={<IconStethoscope size={14} />}
              label="Gestation"
              value={dueDateToGestationalAge(new Date(labour.due_date))}
            />
          )}
          {isCompleted && labour.end_time && (
            <StatCard
              icon={<IconBabyCarriage size={14} />}
              label="Arrived"
              value={new Date(labour.end_time).toLocaleDateString()}
            />
          )}
          <StatCard
            icon={<IconActivityHeartbeat size={14} />}
            label="Status"
            value={currentPhase.toLowerCase()}
          />
          <StatCard
            icon={<IconUserHeart size={14} />}
            label="First baby"
            value={labour.first_labour ? 'Yes' : 'No'}
          />
        </div>

        {/* Closing Note (if completed) */}
        {isCompleted && labour.notes && (
          <div className={classes.noteCard}>
            <p className={classes.noteLabel}>Your closing note</p>
            <p className={classes.noteText}>{labour.notes}</p>
          </div>
        )}

        {/* Complete Labour Section */}
        {!isCompleted && (
          <div className={classes.completeSection}>
            <Title order={2} fz={{ base: 'h4', xs: 'h3', sm: 'h2' }}>
              Ready to complete your labour?
            </Title>
            <p className={classes.completeSectionText}>
              Add an optional closing note to share with your subscribers, then mark your labour as
              complete.
            </p>
            <Textarea
              placeholder="Welcome to the world, little one! Everyone is healthy and happy."
              rightSection={<IconPencil size={16} stroke={1.5} />}
              radius="md"
              size="sm"
              minRows={3}
              value={labourNotes}
              onChange={(event) => setLabourNotes(event.currentTarget.value)}
              classNames={{
                input: baseClasses.input,
                section: baseClasses.section,
              }}
            />

            <div className={classes.buttonRow}>
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
            </div>
          </div>
        )}
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
