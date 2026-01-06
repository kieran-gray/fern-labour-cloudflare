import { AppShell } from '@components/AppShell';
import { IconMessageHeart } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { Button, Image, Space } from '@mantine/core';
import { ShareFernLabour } from '../Home/Tabs/MySubscriptions/ShareFernLabour';
import image from './thanks.svg';
import classes from './Page.module.css';
import baseClasses from '@styles/base.module.css';

export const CompletedLabourCard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={baseClasses.card}>
      <div className={classes.container}>
        <header className={classes.header}>
          <div className={classes.headerDecoration} />
          <p className={classes.greeting}>Congratulations</p>
          <h1 className={classes.title}>
            Thank you for choosing <br />
            <span className={classes.titleAccent}>Fern Labour</span>
          </h1>
        </header>

        <div className={classes.celebration}>
          <h3 className={classes.celebrationTitle}>You did it!</h3>
          <p className={classes.celebrationText}>
            Bringing new life into the world is an incredible journey, and we are so proud of you.
            Take a deep breath, soak in this beautiful moment, and know that you are amazing.
          </p>
        </div>

        <div className={classes.imageContainer}>
          <Image src={image} w={320} h={220} className={classes.image} />
        </div>

        <div className={classes.feedbackCard}>
          <p className={classes.feedbackText}>
            We're so grateful you chose to use our platform. If you'd like to, we'd love to know
            what you liked or what you would like to see done differently.
          </p>
          <Button
            size="md"
            radius="xl"
            variant="light"
            leftSection={<IconMessageHeart size={18} />}
            onClick={() => navigate('/contact?show=testimonial')}
          >
            Share feedback
          </Button>
        </div>
      </div>
    </div>
  );
};

export const CompletedLabourPage: React.FC = () => {
  return (
    <AppShell>
      <div className={baseClasses.flexPageColumn}>
        <CompletedLabourCard />
        <Space h="xl" />
        <ShareFernLabour />
      </div>
    </AppShell>
  );
};
