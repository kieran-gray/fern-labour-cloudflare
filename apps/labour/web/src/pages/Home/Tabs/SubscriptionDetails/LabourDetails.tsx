import { LabourReadModel } from '@base/clients/labour_service';
import { ResponsiveDescription } from '@base/components/Text/ResponsiveDescription';
import { ResponsiveTitle } from '@base/components/Text/ResponsiveTitle';
import image from '@home/Tabs/ManageLabour/Meditate.svg';
import { dueDateToGestationalAge } from '@lib';
import { Badge, Image, Text } from '@mantine/core';
import classes from '@home/Tabs/ManageLabour/LabourDetails.module.css';
import baseClasses from '@styles/base.module.css';

export default function LabourDetails({
  labour,
  birthingPersonName,
}: {
  labour: LabourReadModel;
  birthingPersonName: string;
}) {
  const completed = labour.end_time !== null;
  const activeDescription =
    'You’re here to support someone on an incredible journey, and that means giving them the space they need during labour. Instead of reaching out directly, check the app for updates or turn on notifications below to stay informed.';
  const completedDescription =
    'You were part of this incredible journey, providing support during a life-changing moment. This page shows the updates and notifications you received throughout the labour experience.';
  const currentPhase = completed
    ? 'Completed'
    : labour.current_phase === 'PLANNED'
      ? 'Not in labour'
      : `In ${labour.current_phase} labour`;

  const title = labour.labour_name ? labour.labour_name : `${birthingPersonName} Labour`;
  const description = completed ? completedDescription : activeDescription;
  return (
    <div className={baseClasses.root}>
      <div className={baseClasses.body}>
        <div className={baseClasses.inner} style={{ paddingBottom: 0 }}>
          <div className={classes.content} style={{ marginRight: 0 }}>
            <ResponsiveTitle title={title} />
            <ResponsiveDescription description={description} marginTop={10} />
            <div className={baseClasses.imageFlexRow} style={{ marginTop: 10 }}>
              <Image src={image} className={classes.smallImage} />
            </div>
          </div>
          <div className={baseClasses.flexColumn}>
            <Image src={image} className={classes.image} />
          </div>
        </div>
        <div className={baseClasses.inner}>
          <div className={baseClasses.content}>
            <div className={classes.infoRow}>
              <Badge variant="filled" className={classes.labourBadge} size="lg">
                {currentPhase}
              </Badge>
              <Badge variant="filled" className={classes.labourBadge} size="lg">
                Due: {new Date(labour.due_date).toLocaleDateString()}
              </Badge>
              {!completed && (
                <Badge variant="filled" className={classes.labourBadge} size="lg">
                  Gestational age: {dueDateToGestationalAge(new Date(labour.due_date))}
                </Badge>
              )}
              {completed && (
                <Badge variant="filled" className={classes.labourBadge} size="lg">
                  Arrived: {new Date(labour.end_time!).toLocaleDateString()}
                </Badge>
              )}
            </div>
            {labour.notes && (
              <>
                <Text mt={15} mb={15}>
                  {birthingPersonName} Closing Note:
                </Text>
                <div className={classes.infoRow}>{labour.notes}</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
