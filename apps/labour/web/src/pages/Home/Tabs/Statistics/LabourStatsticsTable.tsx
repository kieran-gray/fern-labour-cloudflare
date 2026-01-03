import { formatTimeSeconds } from '@lib';
import { Table } from '@mantine/core';
import { LabourStatisticsData } from '../../../../hooks/useLabourStatistics';
import classes from './LabourStatistics.module.css';

export const LabourStatisticsTable = ({ data }: { data: LabourStatisticsData }) => {
  return (
    <Table variant="vertical" borderColor="var(--mantine-color-primary-2)">
      <Table.Tbody>
        <Table.Tr>
          <Table.Th className={classes.tableHeader}>Contractions</Table.Th>
          <Table.Td className={classes.labourStatsText}>{data.contraction_count}</Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th className={classes.tableHeader}>Avg contraction duration</Table.Th>
          <Table.Td className={classes.labourStatsText}>
            {formatTimeSeconds(data.average_duration)}
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th className={classes.tableHeader}>Avg contraction frequency</Table.Th>
          <Table.Td className={classes.labourStatsText}>
            {formatTimeSeconds(data.average_frequency)}
          </Table.Td>
        </Table.Tr>

        <Table.Tr>
          <Table.Th className={classes.tableHeader}>Avg contraction intensity:</Table.Th>
          <Table.Td className={classes.labourStatsText}>
            {data.average_intensity.toPrecision(2)} out of 10
          </Table.Td>
        </Table.Tr>
      </Table.Tbody>
    </Table>
  );
};
