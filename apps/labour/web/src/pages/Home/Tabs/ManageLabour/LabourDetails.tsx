import { ResponsiveDescription } from '@base/components/Text/ResponsiveDescription';
import { ResponsiveTitle } from '@base/components/Text/ResponsiveTitle';
import { useLabourSession } from '@base/contexts/LabourSessionContext';
import { useLabourById, useLabourClient } from '@base/hooks';
import { PageLoadingIcon } from '@components/PageLoading/Loading';
import { dueDateToGestationalAge } from '@lib';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, Image, Text } from '@mantine/core';
import image from './Meditate.svg';
import classes from './LabourDetails.module.css';
import baseClasses from '@styles/base.module.css';

export default function LabourDetails({ setActiveTab }: { setActiveTab: Function }) {
  const navigate = useNavigate();
  const { labourId } = useLabourSession();
  const client = useLabourClient();
  const { isPending, isError, data, error } = useLabourById(client, labourId);

  let content = undefined;

  if (isPending) {
    content = (
      <div className={baseClasses.inner}>
        <div style={{ margin: 'auto' }}>
          <PageLoadingIcon />
        </div>
      </div>
    );
  } else if (isError) {
    content = (
      <div className={baseClasses.inner}>
        <Text c="var(--mantine-color-gray-7)">
          Something went wrong... {error ? error.message : ''}
        </Text>
      </div>
    );
  } else {
    const title = data.labour_name ? data.labour_name : 'Your Labour';
    const completed = data.end_time !== null;
    const activeDescription =
      'Take a deep breath, you’ve got this! Here, you can check your labour details.';
    const completedDescription =
      'Welcome back! You’re viewing your completed labour journey. All details are preserved for your reference, though editing is no longer available. Browse through the tabs above to revisit each part of your experience.';
    const currentPhase = completed
      ? 'Completed'
      : data.current_phase === 'PLANNED'
        ? 'Not in labour'
        : `In ${data.current_phase} labour`;
    content = (
      <>
        <div className={baseClasses.inner} style={{ paddingBottom: 0 }}>
          <div className={classes.content}>
            <ResponsiveTitle title={title} />
            <ResponsiveDescription
              description={completed ? completedDescription : activeDescription}
              marginTop={10}
            />
            <div className={baseClasses.imageFlexRow} style={{ marginTop: '10px' }}>
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
                Due: {new Date(data.due_date).toLocaleDateString()}
              </Badge>
              {!completed && (
                <Badge variant="filled" className={classes.labourBadge} size="lg">
                  Gestational age: {dueDateToGestationalAge(new Date(data.due_date))}
                </Badge>
              )}
              {completed && (
                <Badge variant="filled" className={classes.labourBadge} size="lg">
                  Arrived: {new Date(data.end_time!).toLocaleDateString()}
                </Badge>
              )}

              <Badge variant="filled" className={classes.labourBadge} size="lg">
                {!data.first_labour ? 'Not ' : ''}first time mother
              </Badge>
            </div>
            {data.notes && (
              <>
                <Text mt={15} mb={15}>
                  Your closing Note:
                </Text>
                <div className={classes.infoRow}>{data.notes}</div>
              </>
            )}
            {!completed && (
              <div className={baseClasses.flexRow} style={{ marginTop: '20px' }}>
                <Button
                  color="var(--mantine-color-pink-4)"
                  leftSection={<IconArrowLeft size={18} stroke={1.5} />}
                  variant="light"
                  radius="xl"
                  size="md"
                  h={48}
                  className={classes.backButton}
                  onClick={() => navigate('/onboarding')}
                  type="submit"
                >
                  Go back to planning
                </Button>
                <Button
                  color="var(--mantine-color-pink-4)"
                  rightSection={<IconArrowRight size={18} stroke={1.5} />}
                  variant="filled"
                  radius="xl"
                  size="md"
                  h={48}
                  onClick={() => setActiveTab('complete')}
                  type="submit"
                >
                  Complete your labour
                </Button>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className={baseClasses.root}>
      <div className={baseClasses.body}>{content}</div>
    </div>
  );
}
