import { LabourReadModel } from '@base/clients/labour_service';
import { dueDateToGestationalAge } from '@lib';
import {
  IconActivityHeartbeat,
  IconBabyCarriage,
  IconCalendarEvent,
  IconStethoscope,
} from '@tabler/icons-react';
import { Text } from '@mantine/core';
import MeditateIllustration from '../ManageLabour/Meditate.svg';
import classes from '../ManageLabour/Manage.module.css';
import baseClasses from '@styles/base.module.css';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const StatCard = ({ icon, label, value }: StatCardProps) => (
  <div className={classes.statCard}>
    <Text className={classes.statCardLabel}>
      {icon}
      {label}
    </Text>
    <Text className={classes.statCardValue}>{value}</Text>
  </div>
);

interface SubscriberLabourDetailsProps {
  labour: LabourReadModel;
  motherName: string;
}

export function SubscriberLabourDetails({ labour, motherName }: SubscriberLabourDetailsProps) {
  const isCompleted = labour.end_time !== null;

  const currentPhase = isCompleted
    ? 'Completed'
    : labour.current_phase === 'PLANNED'
      ? 'Not in labour'
      : `In ${labour.current_phase} labour`;

  const title = labour.labour_name || `${motherName} Labour`;
  const subtitle = isCompleted
    ? 'The completed labour journey.'
    : `You're here to support someone on an incredible journey. Check the app regularly for updates or turn on notifications below to stay informed.`;

  return (
    <div className={baseClasses.card}>
      <div className={classes.container}>
        {/* Header with illustration */}
        <header className={classes.header}>
          <div className={classes.headerContent}>
            <div className={classes.headerText}>
              <h1 className={classes.title}>{title}</h1>
              <p className={classes.subtitle}>{subtitle}</p>
            </div>
            <div className={classes.illustrationWrapper}>
              <img
                src={MeditateIllustration}
                alt=""
                className={classes.illustration}
                aria-hidden="true"
              />
            </div>
          </div>
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
        </div>

        {/* Closing Note (if completed) */}
        {isCompleted && labour.notes && (
          <div className={classes.noteCard}>
            <p className={classes.noteLabel}>{motherName}'s closing note</p>
            <p className={classes.noteText}>{labour.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
