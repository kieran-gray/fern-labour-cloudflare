import { Card } from '@base/components/Cards/Card';
import { AppShell } from '@components/AppShell';
import { Space } from '@mantine/core';
import { LabourHistoryTable } from './LabourHistoryTable';
import baseClasses from '@styles/base.module.css';

export const LabourHistoryPage = () => {
  const title = 'Your labour history';
  const description =
    'View and manage your past labour records. Select any entry to see the full timeline and statistics.';

  return (
    <AppShell>
      <div className={baseClasses.flexPageColumn}>
        <Card title={title} description={description}>
          <Space h="md" />
          <LabourHistoryTable />
        </Card>
      </div>
    </AppShell>
  );
};
