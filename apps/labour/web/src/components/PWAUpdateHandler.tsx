import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button, Group, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';

export function PWAUpdateHandler() {
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log(`SW Registered: ${r}`);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      notifications.show({
        id: 'pwa-update-available',
        title: 'App update available',
        message: (
          <Group>
            <Text size="sm">A new version is available. Reload to update?</Text>
            <Group gap="xs">
              <Button
                size="xs"
                variant="light"
                onClick={() => {
                  updateServiceWorker(true);
                  notifications.hide('pwa-update-available');
                }}
              >
                Update
              </Button>
              <Button
                size="xs"
                variant="subtle"
                onClick={() => {
                  setNeedRefresh(false);
                  notifications.hide('pwa-update-available');
                }}
              >
                Later
              </Button>
            </Group>
          </Group>
        ),
        color: 'blue',
        radius: 'lg',
        autoClose: false,
        withCloseButton: true,
      });
    }
  }, [needRefresh, updateServiceWorker, setNeedRefresh]);

  useEffect(() => {
    return () => {
      if (!offlineReady) {
        notifications.hide('pwa-offline-ready');
      }
      if (!needRefresh) {
        notifications.hide('pwa-update-available');
      }
    };
  }, [offlineReady, needRefresh]);

  return null;
}
