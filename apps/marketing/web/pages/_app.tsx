import '@mantine/core/styles.css';
import '../styles/globals.css';

import type { AppProps } from 'next/app';
import { Poppins, Quicksand } from 'next/font/google';
import Head from 'next/head';
import { MantineProvider } from '@mantine/core';
import { theme } from '../theme';

const poppins = Poppins({
  weight: ['400'],
  subsets: ['latin'],
  display: 'swap',
});

const quicksand = Quicksand({
  subsets: ['latin'],
  display: 'swap',
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <MantineProvider theme={theme}>
      <Head>
        <title>Fern Labour</title>
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
        <meta
          name="description"
          content="Fern Labour: Effortlessly plan and track your labour with our app. Monitor contractions and share updates with loved ones seamlessly. No download required!"
        />
        <meta
          name="keywords"
          content="Contraction, Tracker, Labour, Labor, Baby, Timer, Birth, Pregnancy, Pregnant"
        />
        <link rel="preload" href="/logo/logo.svg" as="image" type="image/svg+xml" />
        <link rel="icon" type="image/png" href="/favicon/favicon-96x96.png" sizes="96x96" />
        <link rel="icon" type="image/svg+xml" href="/favicon/favicon.svg" />
        <link rel="shortcut icon" href="/favicon/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-title" content="Fern Labour" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
      </Head>
      <main className={`${poppins}, ${quicksand}`}>
        <Component {...pageProps} />
      </main>
    </MantineProvider>
  );
}
