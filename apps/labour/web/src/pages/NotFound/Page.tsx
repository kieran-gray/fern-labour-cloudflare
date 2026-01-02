import { AppShell } from '@components/AppShell';
import { Card } from '@components/Cards/Card';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mantine/core';
import image from './notFound.svg';
import baseClasses from '@styles/base.module.css';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AppShell>
      <div className={baseClasses.flexPageColumn}>
        <Card
          title="We're not sure how you got here..."
          description="The page you are trying to open does not exist. You may have mistyped the address, or the page has been moved to another URL. If you think this is an error contact support."
          image={{ src: image, width: 350 }}
          mobileImage={{ src: image, width: 250, height: 250 }}
        >
          <Button
            variant="outline"
            size="md"
            mt="xl"
            radius="xl"
            w="100%"
            onClick={() => navigate('/')}
          >
            Lets take you home
          </Button>
        </Card>
      </div>
    </AppShell>
  );
};
