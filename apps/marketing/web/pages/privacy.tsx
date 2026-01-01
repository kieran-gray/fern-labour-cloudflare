import { Metadata } from 'next';
import Head from 'next/head';
import { IconArrowUp } from '@tabler/icons-react';
import { Affix, Button, Transition } from '@mantine/core';
import { useWindowScroll } from '@mantine/hooks';
import { FooterSimple } from '@/components/Footer/Footer';
import { Header01 } from '@/components/PillHeader/PillHeader';
import { PrivacyPolicy } from '@/components/Privacy/PrivacyPolicy';

export const metadata: Metadata = {
  title: 'Your Privacy Matters: Fern Labour’s Data Protection Guide',
  description: 'Learn about your data rights and privacy with Fern Labour.',
  metadataBase: new URL('https://fernlabour.com/privacy'),
};

export default function PrivacyPage() {
  const [scroll, scrollTo] = useWindowScroll();

  return (
    <>
      <Head>
        <meta
          property="og:title"
          content="Your Privacy Matters: Fern Labour’s Data Protection Guide"
        />
        <meta
          property="og:description"
          content="Learn about your data rights and privacy with Fern Labour."
        />
        <meta property="og:url" content="https://fernlabour.com/privacy" />
      </Head>
      <Header01
        breakpoint="sm"
        callToActionTitle="Go to app"
        callToActionUrl={process.env.NEXT_PUBLIC_FRONTEND_URL}
        h="80"
        radius="50px"
        landingPage={false}
      />
      <div style={{ padding: '15px' }}>
        <PrivacyPolicy />
        <Affix position={{ bottom: 20, right: 20 }}>
          <Transition transition="slide-up" mounted={scroll.y > 0}>
            {(transitionStyles) => (
              <Button
                leftSection={<IconArrowUp size={16} />}
                style={transitionStyles}
                onClick={() => scrollTo({ y: 0 })}
                bg="var(--mantine-color-pink-4)"
                radius="lg"
              >
                Scroll to top
              </Button>
            )}
          </Transition>
        </Affix>
      </div>
      <div style={{ flexGrow: 1 }} />
      <FooterSimple />
    </>
  );
}
