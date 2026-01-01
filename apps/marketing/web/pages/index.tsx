import Head from 'next/head';
import { Space } from '@mantine/core';
import { ContactMessageFloating } from '@/components/ContactMessageFloating/ContactMessageFloating';
import { FooterSimple } from '@/components/Footer/Footer';
import { FaqWithImage } from '@/components/Landing/FAQ/FaqWithImage';
import { Feature02 } from '@/components/Landing/FeaturesMotion/FeaturesMotion';
import { FinalCTA } from '@/components/Landing/FinalCTA/FinalCTA';
import { Hero03 } from '@/components/Landing/HeroMotion/HeroMotion';
import {
  CallToActionText,
  HeroText,
  PricingText,
  ProblemSolutionText,
  SocialProofTrustText,
} from '@/components/Landing/LandingPageCopy';
import { Pricing01 } from '@/components/Landing/Pricing/Pricing';
import { ProblemSolution } from '@/components/Landing/ProblemSolution/ProblemSolution';
import { SocialProofTrust } from '@/components/Landing/SocialProofTrust/SocialProofTrust';
import { Header01 } from '@/components/PillHeader/PillHeader';

export default function HomePage() {
  return (
    <>
      <Head>
        <meta property="og:title" content="Track Labour Progress & Share Updates Effortlessly" />
        <meta
          property="og:description"
          content="Track labour and share updates privately with Fern Labour!"
        />
        <meta property="og:url" content="https://fernlabour.com" />
      </Head>
      <Header01
        breakpoint="sm"
        callToActionTitle="Go to app"
        callToActionUrl={process.env.NEXT_PUBLIC_FRONTEND_URL}
        h="80"
        radius="50px"
      />
      <Hero03 {...HeroText} />
      <ProblemSolution {...ProblemSolutionText} />
      <Space h={40} />
      <Feature02 title="How Fern Labour Works" />
      <SocialProofTrust {...SocialProofTrustText} />
      <Pricing01 callToActionUrl={process.env.NEXT_PUBLIC_FRONTEND_URL || '#'} {...PricingText} />
      <FaqWithImage />
      <FinalCTA {...CallToActionText} />
      <ContactMessageFloating />
      <FooterSimple />
    </>
  );
}
