import { AppShell } from '@components/AppShell';
import { Group, Skeleton, Space, Stack } from '@mantine/core';
import baseClasses from '@styles/base.module.css';

export function CardSkeleton() {
  return (
    <div className={baseClasses.root}>
      <div className={baseClasses.body}>
        <div className={baseClasses.inner}>
          <Stack gap="md" style={{ flex: 1 }}>
            {/* Title */}
            <Skeleton height={32} width="60%" radius="md" />
            {/* Description */}
            <Skeleton height={16} width="90%" radius="sm" />
            <Skeleton height={16} width="75%" radius="sm" />
            <Skeleton height={16} width="80%" radius="sm" />
            {/* Content area */}
            <Stack gap="sm" mt="md">
              <Skeleton height={200} radius="md" />
              <Group gap="sm">
                <Skeleton height={36} width={100} radius="xl" />
                <Skeleton height={36} width={100} radius="xl" />
              </Group>
            </Stack>
          </Stack>
        </div>
      </div>
    </div>
  );
}

interface PageSkeletonProps {
  count?: number;
  preAuth?: boolean;
}

export function PageSkeleton({ count = 1, preAuth }: PageSkeletonProps) {
  return (
    <AppShell preAuth={preAuth}>
      <div className={baseClasses.flexPageColumn}>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} style={{ width: '100%' }}>
            <CardSkeleton />
            {index < count - 1 && <Space h="xl" />}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
