import { IconMenu2 } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import {
  ActionIcon,
  Burger,
  Container,
  Drawer,
  Flex,
  Group,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { MobileUserMenu } from './UserMenu';
import classes from './PillHeader.module.css';

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  requiresPaid?: boolean;
}

interface PillHeaderProps {
  navItems?: readonly NavItem[];
  activeNav?: string | null;
  onNavChange?: (nav: string) => void;
}

export function PillHeader({ navItems, activeNav, onNavChange }: PillHeaderProps) {
  const [drawerOpened, { toggle: toggleDrawer }] = useDisclosure(false);
  const isMobile = useMediaQuery('(max-width: 48em)');
  const navigate = useNavigate();

  return (
    <Container
      className={classes.container}
      component="header"
      mt="10px"
      mx={{ base: '15px', sm: 'auto' }}
      w={{ base: 'auto', sm: '95%' }}
      maw={{ sm: 1050 }}
      h={60}
    >
      <Flex
        justify="space-between"
        align="center"
        h="100%"
        style={{ overflow: 'hidden' }}
        wrap="nowrap"
      >
        {/* Left: Burger + Logo */}
        <Group gap={0} style={{ flexShrink: 0 }}>
          <Burger
            size="sm"
            opened={drawerOpened}
            onClick={toggleDrawer}
            hiddenFrom="sm"
            color="var(--mantine-color-white)"
            title="Menu"
          />
          <div onClick={() => navigate('/')} className={classes.logoContainer}>
            <img src="/logo/logo.svg" className={classes.icon} alt="Fern Logo" />
            <Text className={classes.title}>Fern Labour</Text>
          </div>
        </Group>

        {/* User Menu Drawer */}
        <Drawer
          size="xs"
          classNames={{
            content: classes.drawer,
            header: classes.drawer,
            body: classes.drawerBody,
          }}
          overlayProps={{ backgroundOpacity: 0.4, blur: 3 }}
          position={isMobile ? 'left' : 'right'}
          opened={drawerOpened}
          onClose={toggleDrawer}
        >
          <MobileUserMenu />
        </Drawer>

        {/* Center: Navigation (Desktop Only) */}
        {navItems && navItems.length > 0 && (
          <Group gap={4} visibleFrom="sm" className={classes.navGroup}>
            {navItems.map(({ id, label, icon: Icon }) => (
              <UnstyledButton
                key={id}
                className={`${classes.navItem} ${activeNav === id ? classes.navItemActive : ''}`}
                onClick={() => onNavChange?.(id)}
              >
                <Icon size={18} className={classes.navItemIcon} />
                <Text size="sm" className={classes.navItemLabel}>
                  {label}
                </Text>
              </UnstyledButton>
            ))}
          </Group>
        )}

        {/* Right: Menu Button */}
        <Group gap="sm" style={{ flexShrink: 0 }}>
          <ActionIcon
            variant="subtle"
            color="white"
            size="lg"
            radius="xl"
            visibleFrom="sm"
            className={`${classes.userAction} ${drawerOpened ? classes.userActionActive : ''}`}
            onClick={toggleDrawer}
            title="Menu"
          >
            <IconMenu2 size={20} />
          </ActionIcon>
        </Group>
      </Flex>
    </Container>
  );
}
