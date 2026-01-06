import { forwardRef, memo, useCallback } from 'react';
import { AppMode, useLabourSession } from '@base/contexts';
import { useClerk, useUser } from '@clerk/clerk-react';
import {
  IconArrowLeft,
  IconChevronRight,
  IconHistory,
  IconHome,
  IconLogout,
  IconMessageCircleQuestion,
  IconMoon,
  IconSun,
  IconSwitchHorizontal,
} from '@tabler/icons-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Avatar, Button, Group, Text, UnstyledButton, useMantineColorScheme } from '@mantine/core';
import classes from './HeaderMenu.module.css';

interface UserButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  name: string;
}

const flexOneStyle = { flex: 1 } as const;

export const UserButton = memo(
  forwardRef<HTMLButtonElement, UserButtonProps>(({ name, ...others }: UserButtonProps, ref) => (
    <UnstyledButton ref={ref} className={classes.userButton} {...others}>
      <Group>
        <Avatar radius="xl" />
        <div style={flexOneStyle}>
          <Text size="sm" fw={500}>
            {name}
          </Text>
        </div>
        <IconChevronRight size={16} className={classes.userButtonChevron} />
      </Group>
    </UnstyledButton>
  ))
);

export const HeaderMenu = memo(() => {
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { mode, setMode } = useLabourSession();
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const switchToMode = mode === AppMode.Birth ? AppMode.Subscriber : AppMode.Birth;

  const handleThemeToggle = useCallback(() => {
    setColorScheme(colorScheme === 'light' ? 'dark' : 'light');
  }, [colorScheme, setColorScheme]);

  const handleNavigateHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleSwitchMode = useCallback(() => {
    setMode(switchToMode);
    navigate('/');
  }, [setMode, switchToMode, navigate]);

  const handleNavigateHistory = useCallback(() => {
    navigate('/history');
  }, [navigate]);

  const handleNavigateContact = useCallback(() => {
    navigate('/contact');
  }, [navigate]);

  const handleOpenProfile = useCallback(() => {
    openUserProfile();
  }, [openUserProfile]);

  const handleLogout = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      void signOut({ redirectUrl: window.location.origin });
    },
    [signOut]
  );

  const themeIcon =
    colorScheme === 'light' ? (
      <IconMoon size={16} stroke={1.5} />
    ) : (
      <IconSun size={16} stroke={1.5} />
    );

  return (
    <div className={classes.linksDrawer}>
      <div className={classes.menuSection}>
        <Group>
          <Button
            key="theme"
            className={classes.mainLink}
            onClick={handleThemeToggle}
            leftSection={themeIcon}
            size="md"
            w="100%"
            variant="transparent"
          >
            {colorScheme === 'light' ? 'Night mode' : 'Day mode'}
          </Button>
          {mode === null && pathname !== '/' && (
            <Button
              key="home"
              className={classes.mainLink}
              onClick={handleNavigateHome}
              leftSection={<IconHome size={16} stroke={1.5} />}
              size="md"
              w="100%"
              variant="transparent"
            >
              Home
            </Button>
          )}
          {mode !== null && (
            <>
              <Button
                key="update"
                className={classes.mainLink}
                onClick={handleSwitchMode}
                leftSection={<IconSwitchHorizontal size={16} stroke={1.5} />}
                size="md"
                w="100%"
                variant="transparent"
              >
                {switchToMode === AppMode.Subscriber ? 'Support mode' : 'Birth mode'}
              </Button>
              {mode === AppMode.Birth && ['/history', '/contact'].includes(pathname) && (
                <Button
                  key="history"
                  onClick={handleNavigateHome}
                  leftSection={<IconArrowLeft size={16} stroke={1.5} />}
                  className={classes.mainLink}
                  size="md"
                  w="100%"
                  variant="transparent"
                >
                  Go to your labour
                </Button>
              )}
            </>
          )}
          {pathname !== '/history' && (
            <Button
              key="labour"
              onClick={handleNavigateHistory}
              className={classes.mainLink}
              leftSection={<IconHistory size={16} stroke={1.5} />}
              size="md"
              w="100%"
              variant="transparent"
            >
              Labour history
            </Button>
          )}
        </Group>
      </div>

      <div className={classes.footer}>
        <UserButton
          name={user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? ''}
          onClick={handleOpenProfile}
        />
        <Button
          key="logout"
          className={classes.logoutLink}
          onClick={handleLogout}
          size="md"
          w="100%"
          variant="transparent"
          leftSection={<IconLogout size={16} stroke={1.5} />}
        >
          Logout
        </Button>
        {pathname !== '/contact' && (
          <Button
            key="contact"
            onClick={handleNavigateContact}
            className={classes.mainLink}
            leftSection={<IconMessageCircleQuestion size={16} stroke={1.5} />}
            size="md"
            w="100%"
            variant="transparent"
          >
            Contact us
          </Button>
        )}
      </div>
    </div>
  );
});
