import Link from 'next/link';
import { Button, Container, Image, Text, Title } from '@mantine/core';
import { FooterSimple } from '@/components/Footer/Footer';
import classes from '@/components/NotFoundImage.module.css';
import { Header01 } from '@/components/PillHeader/PillHeader';

export default function Contact() {
  return (
    <div style={{ height: '100svh', display: 'flex', flexDirection: 'column' }}>
      <Header01
        breakpoint="sm"
        callToActionTitle="Go to app"
        callToActionUrl={process.env.NEXT_PUBLIC_FRONTEND_URL}
        h="80"
        radius="50px"
        landingPage={false}
      />
      <div style={{ padding: '20px' }}>
        <Container className={classes.root} mt={20}>
          <div style={{ justifyContent: 'space-between' }}>
            <Title order={2} visibleFrom="sm">
              We're not sure how you got here...
            </Title>
            <Title order={3} hiddenFrom="sm">
              We're not sure how you got here...
            </Title>
            <div className={classes.imageFlexRow}>
              <Image src="/images/notFound.svg" className={classes.mobileImage} />
            </div>
            <Text c="var(--mantine-color-gray-8)" size="lg" mt="30">
              The page you are trying to open does not exist. You may have mistyped the address, or
              the page has been moved to another URL. If you think this is an error contact support.
            </Text>
            <Link href="/">
              <Button variant="outline" size="md" mt="xl" radius="xl" className={classes.control}>
                Lets take you home
              </Button>
            </Link>
          </div>
          <Image src="/images/notFound.svg" className={classes.desktopImage} />
        </Container>
      </div>
      <div style={{ flexGrow: 1 }} />
      <FooterSimple />
    </div>
  );
}
