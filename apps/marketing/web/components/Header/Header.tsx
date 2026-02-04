'use client';

import NextLink from 'next/link';
import { IconArrowRight } from '@tabler/icons-react';
import { motion } from 'motion/react';
import {
  Anchor,
  Burger,
  Button,
  Container,
  ContainerProps,
  Drawer,
  Flex,
  Group,
  MantineBreakpoint,
  MantineRadius,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import classes from './Header.module.css';

type HeaderLink = {
  label: string;
  href: string;
};

const HEADER_LINKS: HeaderLink[] = [
  { label: 'Home', href: '#home' },
  { label: 'How It Works', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Blog', href: '/blog' },
];

const OTHER_PAGE_HEADER_LINKS: HeaderLink[] = [
  { label: 'Home', href: '/' },
  { label: 'Blog', href: '/blog' },
];

type Header01Props = ContainerProps & {
  /** Logo to display in the header */
  logo?: React.ReactNode;

  /** Links to display in the header */
  links?: HeaderLink[];

  /** Title for the call to action button */
  callToActionTitle?: string;

  /** URL for the call to action button */
  callToActionUrl?: string;

  /** Callback for when the menu is toggled */
  onMenuToggle?: () => void;

  /** Whether the menu is open */
  isMenuOpen?: boolean;

  /** Breakpoint at which the menu is displayed */
  breakpoint?: MantineBreakpoint;

  /** Border radius of the header */
  radius?: MantineRadius | number;

  /** Is this the landing page? */
  landingPage?: boolean;
};

export const Header01 = ({
  style,
  breakpoint = 'xs',
  logo = (
    <>
      <NextLink href="/">
        <img src="/logo/logo.svg" className={classes.icon} alt="Fern Logo" />
      </NextLink>
      <Text fw="bold" className={classes.title}>
        Fern Labour
      </Text>
    </>
  ),
  callToActionTitle = 'Join Now',
  callToActionUrl = '#',
  links = HEADER_LINKS,
  onMenuToggle,
  isMenuOpen,
  h,
  radius = 50,
  landingPage = true,
  ...containerProps
}: Header01Props) => {
  const [opened, { toggle }] = useDisclosure(false);

  const useLinks = landingPage ? links : OTHER_PAGE_HEADER_LINKS;
  const navLinks = useLinks.map((link) => (
    <Anchor
      key={link.href}
      className={classes.link}
      href={link.href}
      component={NextLink}
      td="none"
      onClick={(event) => {
        if (link.href.startsWith('#')) {
          event.preventDefault();
          const element = document.getElementById(link.href);
          const headerOffset = 120;
          const elementPos = element!.getBoundingClientRect().top;
          const offsetPos = elementPos + window.scrollY - headerOffset;
          window.scrollTo({ top: offsetPos, behavior: 'smooth' });
          if (opened) {
            toggle();
          }
        }
      }}
    >
      {link.label}
    </Anchor>
  ));
  const ctaButton = (
    <>
      <Button
        component={NextLink}
        href={callToActionUrl}
        className={classes.cta}
        radius="xl"
        size="md"
        rightSection={<IconArrowRight size={16} />}
        style={{ flexShrink: 0 }}
        visibleFrom="sm"
      >
        {callToActionTitle}
      </Button>
      <Button
        component={NextLink}
        href={callToActionUrl}
        className={classes.cta}
        radius="xl"
        size="sm"
        rightSection={<IconArrowRight size={16} />}
        style={{ flexShrink: 0 }}
        hiddenFrom="sm"
        visibleFrom="xs"
      >
        {callToActionTitle}
      </Button>
      <Button
        component={NextLink}
        href={callToActionUrl}
        className={classes.cta}
        radius="xl"
        size="xs"
        rightSection={<IconArrowRight size={16} />}
        style={{ flexShrink: 0 }}
        hiddenFrom="xs"
      >
        {callToActionTitle}
      </Button>
    </>
  );

  return (
    <Container
      className={classes.container}
      component="header"
      style={{ borderRadius: radius, ...style }}
      mt="10px"
      mx={{ base: '15px', sm: 'auto' }}
      w={{ base: 'auto', sm: '95%' }}
      maw={{ sm: 1050 }}
      h={h}
      {...containerProps}
    >
      <Flex
        justify="space-between"
        align="center"
        h="100%"
        style={{ overflow: 'hidden' }}
        gap="lg"
        wrap="nowrap"
      >
        <Group gap={0} style={{ flexShrink: 0 }}>
          <Burger
            size="sm"
            opened={opened}
            onClick={toggle}
            hiddenFrom={breakpoint}
            color="var(--mantine-color-white)"
            title="Navigation Menu"
          />
          {logo}
        </Group>
        <Drawer
          size="xs"
          classNames={{
            content: classes.drawer,
            header: classes.drawer,
            body: classes.drawerBody,
          }}
          overlayProps={{ backgroundOpacity: 0.2, blur: 2 }}
          position="left"
          opened={opened}
          onClose={toggle}
        >
          <div className={classes.linksDrawer}>{navLinks}</div>
        </Drawer>
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          whileInView={{ width: 'fit-content', opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          viewport={{ once: true }}
        >
          <Flex
            flex={1}
            justify="center"
            px="lg"
            h="100%"
            align="center"
            style={{ overflow: 'hidden' }}
            wrap="nowrap"
            visibleFrom={breakpoint}
            gap="lg"
            className={classes['link-container']}
          >
            {navLinks}
          </Flex>
        </motion.div>
        {ctaButton}
      </Flex>
    </Container>
  );
};
