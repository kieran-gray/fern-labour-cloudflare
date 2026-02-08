import { usePwaInstall } from '@hooks/usePwaInstall';
import { IconDownload, IconShare } from '@tabler/icons-react';
import { Button, Space, Text } from '@mantine/core';
import { Card } from '../Cards/Card';
import baseClasses from '@styles/base.module.css';

export const PwaInstallButton = () => {
    const { isInstallable, install, isStandalone, isIos } = usePwaInstall();

    if (isStandalone || (!isInstallable && !isIos)) {
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
                    {isIos ? (
                        <div
                            className={baseClasses.flexColumn}
                            style={{ width: '100%', gap: '10px', marginTop: '10px' }}
                        >
                            <Text size="sm">
                                To install on iOS:
                                <ol style={{ paddingLeft: '20px', marginTop: '5px', marginBottom: '5px' }}>
                                    <li>
                                        Tap the <strong>Share</strong> button{' '}
                                        <IconShare size={16} style={{ display: 'inline', verticalAlign: 'middle' }} />
                                    </li>
                                    <li>
                                        Scroll down and tap <strong>Add to Home Screen</strong>
                                    </li>
                                </ol>
                            </Text>
                        </div>
                    ) : (
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
                    )}
                </div>
            </Card>
        </>
    );
};
