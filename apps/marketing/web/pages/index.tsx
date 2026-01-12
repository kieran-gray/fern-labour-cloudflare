import Head from 'next/head';
import { ContactMessageFloating } from '@/components/ContactMessageFloating/ContactMessageFloating';
import { FooterSimple } from '@/components/Footer/Footer';
import { Header01 } from '@/components/Header/Header';
import { AlertsFeature } from '@/components/Landing/AlertsFeature/AlertsFeature';
import { FAQ } from '@/components/Landing/FAQ/FAQ';
import { FinalCTA } from '@/components/Landing/FinalCTA/FinalCTA';
import { HeroRedesign } from '@/components/Landing/HeroRedesign/HeroRedesign';
import { InviteFlow } from '@/components/Landing/InviteFlow/InviteFlow';
import { LabourCirclePreview } from '@/components/Landing/LabourCirclePreview/LabourCirclePreview';
import { MotherBenefits } from '@/components/Landing/MotherBenefits/MotherBenefits';
import { PerspectiveShift } from '@/components/Landing/PerspectiveShift/PerspectiveShift';
import { Pricing01 } from '@/components/Landing/Pricing/Pricing';
import { RolesExplained } from '@/components/Landing/RolesExplained/RolesExplained';
import { SimpleUpdates } from '@/components/Landing/SimpleUpdates/SimpleUpdates';
import { SubscriberBenefits } from '@/components/Landing/SubscriberBenefits/SubscriberBenefits';
import { SubscriberExperience } from '@/components/Landing/SubscriberExperience/SubscriberExperience';
import { TrackTogether } from '@/components/Landing/TrackTogether/TrackTogether';

export default function HomePage() {
  return (
    <>
      <Head>
        <meta property="og:title" content="Be present for your birth — Fern Labour" />
        <meta
          property="og:description"
          content="Track contractions and keep your family close, without the distraction. Free for mums."
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
      <div id="#home" />
      <HeroRedesign />

      <div style={{ backgroundColor: '#fdfaf8', padding: 'var(--mantine-spacing-xl) 0' }}>
        <div id="#features" />
        <MotherBenefits />
        <LabourCirclePreview />
        <TrackTogether />
        <AlertsFeature />
        <SimpleUpdates />
      </div>

      <div style={{ backgroundColor: '#fff5f5', padding: 'var(--mantine-spacing-xl) 0' }}>
        <InviteFlow />
        <RolesExplained />
      </div>

      <div style={{ backgroundColor: '#fff9f7', padding: 'var(--mantine-spacing-xl) 0' }}>
        <PerspectiveShift />
        <SubscriberBenefits />
        <SubscriberExperience />
      </div>

      <div style={{ backgroundColor: '#fdfaf8' }}>
        <div id="#pricing" />
        <Pricing01
          title="Pricing"
          description="Free for mums. Family follows for free, or adds notifications."
          callToActionUrl={process.env.NEXT_PUBLIC_FRONTEND_URL || '#'}
        />
        <div id="#faqs" />
        <FAQ />
        <FinalCTA
          title="Start your circle"
          description="Preparing to give birth, or waiting for news? We'll help you stay close."
          cta="Start Tracking"
          subtitle="Free for mums, always"
        />
      </div>

      <ContactMessageFloating />

      <div style={{ backgroundColor: '#fff5f5' }}>
        <FooterSimple />
      </div>
    </>
  );
}
