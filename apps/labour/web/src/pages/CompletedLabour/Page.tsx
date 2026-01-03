import { AppShell } from '@components/AppShell';
import { Card } from '@components/Cards/Card';
import { useNavigate } from 'react-router-dom';
import { Button, Mark, Space, Text } from '@mantine/core';
import { ShareFernLabour } from '../Home/Tabs/MySubscriptions/ShareFernLabour';
import image from './thanks.svg';
import baseClasses from '@styles/base.module.css';

export const CompletedLabourCard: React.FC = () => {
  const navigate = useNavigate();

  const description = (
    <>
      <Mark color="transparent" className={baseClasses.description} fw={700} fz="lg">
        You did it!
      </Mark>{' '}
      Bringing new life into the world is an incredible journey, and we are so proud of you. Take a
      deep breath, soak in this beautiful moment, and know that you are amazing.
    </>
  );

  const feedback = (
    <>
      We're so grateful for you for choosing to use our platform. If you'd like to, we'd love to
      know what you liked or what you would like to see done differently through the contact form
      below.
    </>
  );
  return (
    <Card
      title="Thank you for choosing Fern Labour"
      description={description}
      image={{ src: image, width: 420, height: 280 }}
      mobileImage={{ src: image, width: 320, height: 220 }}
    >
      <Text fz={{ base: 'sm', sm: 'md' }} className={baseClasses.description} mt={10}>
        {feedback}
      </Text>
      <Button size="md" mt={20} radius="xl" variant="light" onClick={() => navigate('/contact')}>
        Contact us
      </Button>
    </Card>
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
