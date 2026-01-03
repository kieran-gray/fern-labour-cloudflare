import { forwardRef } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { Avatar, Button, Group, Text, UnstyledButton, useMantineColorScheme } from '@mantine/core';
import classes from './HeaderMenu.module.css';

interface UserButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  name: string;
}

export const UserButton = forwardRef<HTMLButtonElement, UserButtonProps>(
  ({ name, ...others }: UserButtonProps, ref) => (
    <UnstyledButton ref={ref} className={classes.userButton} {...others}>
      <Group>
        <Avatar radius="xl" />
        <div style={{ flex: 1 }}>
          <Text size="sm" fw={500}>
            {name}
          </Text>
        </div>
        <IconChevronRight size={16} className={classes.userButtonChevron} />
      </Group>
    </UnstyledButton>
  )
);

export function HeaderMenu() {
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const navigate = useNavigate();
  const pathname = window.location.pathname;
  const { mode, setMode } = useLabourSession();
  const switchToMode = mode === AppMode.Birth ? AppMode.Subscriber : AppMode.Birth;
  const { colorScheme, setColorScheme } = useMantineColorScheme();

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
            onClick={() => setColorScheme(colorScheme === 'light' ? 'dark' : 'light')}
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
              onClick={() => {
                navigate('/');
              }}
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
                onClick={() => {
                  setMode(switchToMode);
                  navigate('/');
                }}
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
                  onClick={() => navigate('/')}
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
              onClick={() => navigate('/history')}
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
          onClick={() => openUserProfile()}
        />
        <Button
          key="logout"
          className={classes.logoutLink}
          onClick={(event) => {
            event.preventDefault();
            void signOut({ redirectUrl: window.location.origin });
          }}
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
            onClick={() => navigate('/contact')}
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
}
