import Head from 'next/head';
import { ContactUs } from '@/components/ContactUs/ContactUs';
import { FooterSimple } from '@/components/Footer/Footer';
import { Header01 } from '@/components/Header/Header';

export default function Contact() {
  return (
    <>
      <Head>
        <meta property="og:title" content="Get in Touch: Contact Fern Labour for Support" />
        <meta
          property="og:description"
          content="Connect with Fern Labour for support and inquiries today!"
        />
        <meta property="og:url" content="https://fernlabour.com/contact" />
      </Head>
      <div style={{ height: '100svh', display: 'flex', flexDirection: 'column' }}>
        <Header01
          breakpoint="sm"
          callToActionTitle="Go to app"
          callToActionUrl={process.env.NEXT_PUBLIC_APP_LABOUR_WEB_URL}
          landingPage={false}
        />
        <div style={{ padding: '15px' }}>
          <ContactUs />
        </div>
        <div style={{ flexGrow: 1 }} />
        <FooterSimple />
      </div>
    </>
  );
}
