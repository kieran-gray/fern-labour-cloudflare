import { usePwaInstall } from '@hooks/usePwaInstall';
import { IconDownload } from '@tabler/icons-react';
import { Button, Space } from '@mantine/core';
import { Card } from '../Cards/Card';
import baseClasses from '@styles/base.module.css';

export const PwaInstallButton = () => {
  const { isInstallable, install, isStandalone } = usePwaInstall();

  if (!isInstallable || isStandalone) {
    return null;
  }

  return (
    <>
      <Space h="xl" />
      <Card
        title="Install Fern Labour"
        description="Add Fern Labour to your home screen for quick access during labour."
      >
        <div className={baseClasses.flexRow}>
          <Button
            size="md"
            mt={20}
            miw={200}
            leftSection={<IconDownload size={16} />}
            onClick={install}
            color="pink"
            variant="filled"
            radius="xl"
          >
            Install
          </Button>
        </div>
      </Card>
    </>
  );
};
