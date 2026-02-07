import Link from 'next/link';
import { Button, Image, Text, Title } from '@mantine/core';
import { FooterSimple } from '@/components/Footer/Footer';
import { Header01 } from '@/components/Header/Header';
import classes from '@/components/NotFoundImage.module.css';

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fdfaf8',
      }}
    >
      <Header01
        breakpoint="sm"
        callToActionTitle="Go to app"
        callToActionUrl={process.env.NEXT_PUBLIC_APP_LABOUR_WEB_URL || 'https://app.fernlabour.com'}
        landingPage={false}
      />

      <div className={classes.flexPageColumn}>
        <div className={classes.card}>
          <div className={classes.row}>
            <div className={classes.content}>
              <Title className={classes.title}>We're not sure how you got here...</Title>

              <div className={classes.mobileImageContainer}>
                <Image src="/images/notFound.svg" w={250} h={250} />
              </div>

              <Text className={classes.description}>
                The page you are trying to open does not exist. You may have mistyped the address,
                or the page has been moved to another URL. If you think this is an error contact
                support.
              </Text>

              <Link href="/" style={{ width: 'fit-content' }}>
                <Button variant="outline" size="md" radius="xl" color="pink">
                  Lets take you home
                </Button>
              </Link>
            </div>

            <div className={classes.image}>
              <Image src="/images/notFound.svg" w={350} />
            </div>
          </div>
        </div>
      </div>

      <FooterSimple />
    </div>
  );
}
