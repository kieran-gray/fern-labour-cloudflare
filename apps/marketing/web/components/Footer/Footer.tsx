import Link from 'next/link';
import { useRouter } from 'next/router';
import { Anchor, Container, Grid, Group, Stack, Text, Title } from '@mantine/core';
import classes from './Footer.module.css';

const footerSections = [
  {
    title: 'Fern Labour',
    links: [
      { name: 'Home', href: '#home' },
      { name: 'How It Works', href: '#features' },
      { name: 'Pricing', href: '#pricing' },
      { name: 'Blog', href: '/blog' },
    ],
  },
  {
    title: 'Support & Info',
    links: [
      { name: 'Contact', href: '/contact' },
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms-of-service' },
      { name: 'FAQ', href: '#faqs' },
    ],
  },
];

export function FooterSimple() {
  const currentYear = new Date().getFullYear();
  const router = useRouter();

  return (
    <footer className={classes.footer}>
      <Container className={classes.inner}>
        <div className={classes.logoSection}>
          <Group gap="sm" align="center">
            <Link href="/">
              <img src="/logo/logo.svg" className={classes.icon} alt="Fern Logo" />
            </Link>
            <Title order={2} className={classes.logoText}>
              Fern Labour
            </Title>
          </Group>
        </div>

        <Grid className={classes.sections}>
          {footerSections.map((section, index) => (
            <Grid.Col key={index} span={{ base: 6, sm: 6 }}>
              <Stack gap="sm">
                <Title order={3} className={classes.sectionTitle}>
                  {section.title}
                </Title>
                <Stack gap="xs">
                  {section.links.map((link, linkIndex) => (
                    <Anchor
                      key={linkIndex}
                      href={link.href}
                      className={classes.link}
                      onClick={(event) => {
                        if (link.href.startsWith('#')) {
                          event.preventDefault();

                          const doScroll = () => {
                            const element = document.getElementById(link.href);
                            if (!element) {
                              return;
                            }
                            const headerOffset = 100;
                            const elementPos = element.getBoundingClientRect().top;
                            const offsetPos = elementPos + window.scrollY - headerOffset;
                            window.scrollTo({ top: offsetPos, behavior: 'smooth' });
                          };

                          if (typeof window !== 'undefined' && window.location.pathname !== '/') {
                            router.push('/').then(() => {
                              setTimeout(doScroll, 0);
                            });
                          } else {
                            doScroll();
                          }
                        }
                      }}
                    >
                      {link.name}
                    </Anchor>
                  ))}
                </Stack>
              </Stack>
            </Grid.Col>
          ))}
        </Grid>
      </Container>

      <div className={classes.copyright}>
        <Container className={classes.copyrightInner}>
          <Text className={classes.copyrightText}>
            © {currentYear} Fern Labour. All rights reserved.
          </Text>
        </Container>
      </div>
    </footer>
  );
}
