import Head from 'next/head';
import { IconArrowUp } from '@tabler/icons-react';
import { Affix, Button, Transition } from '@mantine/core';
import { useWindowScroll } from '@mantine/hooks';
import { FooterSimple } from '@/components/Footer/Footer';
import { Header01 } from '@/components/PillHeader/PillHeader';
import { TermsOfService } from '@/components/TermsOfService/TermsOfService';

export default function TermsOfServicePage() {
  const [scroll, scrollTo] = useWindowScroll();

  return (
    <>
      <Head>
        <meta property="og:title" content="Understand Your Rights: Fern Labour Terms of Service" />
        <meta
          property="og:description"
          content="Learn about your data rights and privacy with Fern Labour."
        />
        <meta property="og:url" content="https://fernlabour.com/terms-of-service" />
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
        <TermsOfService />
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
