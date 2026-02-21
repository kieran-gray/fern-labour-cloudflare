import type { LabourReadModel } from '@base/clients/labour_service/types';
import { useLabourClient } from '@base/hooks';
import { useContractionCount, useLabourById } from '@base/hooks/useLabourData';
import { AppShell } from '@components/AppShell';
import { IconDownload } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Loader } from '@mantine/core';
import classes from './Page.module.css';
import baseClasses from '@styles/base.module.css';

export const CompletedLabourCard: React.FC<{ labour: LabourReadModel }> = ({ labour }) => {
  const navigate = useNavigate();
  const client = useLabourClient();
  const { data: contractionCount } = useContractionCount(client, labour.labour_id);

  const formatDuration = (start: string | null, end: string | null) => {
    if (!start) {
      return '-';
    }
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();

    const diffMs = endDate.getTime() - startDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours === 0) {
      return `${diffMinutes}m`;
    }
    return `${diffHours}h ${diffMinutes}m`;
  };

  const formattedDate = (dateString: string | null) => {
    if (!dateString) {
      return '-';
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <div className={classes.wrapper}>
      <div className={classes.content}>
        <div className={classes.bloom}>
          <div className={classes.bloomRing} />
          <div className={classes.bloomRing} />
          <div className={classes.bloomRing} />
          <div className={classes.bloomCenter}>
            <svg className={classes.bloomHeart} viewBox="0 0 32 32">
              <path d="M16 27s-13-8.35-13-16a7 7 0 0 1 13-3.65A7 7 0 0 1 29 11c0 7.65-13 16-13 16z" />
            </svg>
          </div>
        </div>

        <h1 className={classes.headline}>
          Welcome to the
          <br />
          world, little <em>one</em>
        </h1>
        <p className={classes.subhead}>You were extraordinary.</p>

        <p className={classes.bodyText}>
          Take all the time you need. Rest, breathe, and hold your baby close. Your labour journey
          has been recorded, we'll keep it safe for whenever you're ready.
        </p>

        <div className={classes.stats}>
          <div className={classes.stat}>
            <span className={classes.statValue}>
              {formatDuration(labour.start_time, labour.end_time)}
            </span>
            <span className={classes.statLabel}>Total time</span>
          </div>
          <div className={classes.stat}>
            <span className={classes.statValue}>{contractionCount ?? '-'}</span>
            <span className={classes.statLabel}>Contractions</span>
          </div>
          <div className={classes.stat}>
            <span className={classes.statValue}>
              {formattedDate(labour.end_time || labour.updated_at)}
            </span>
            <span className={classes.statLabel}>Birth date</span>
          </div>
        </div>

        <div className={classes.divider}>
          <div className={classes.dividerLine} />
        </div>

        <Button
          className={classes.btnPrimary}
          size="md"
          h={48}
          radius="xl"
          leftSection={<IconDownload />}
        >
          Save my labour summary
        </Button>
        <button
          type="button"
          className={classes.feedbackLink}
          onClick={() => navigate('/contact?show=testimonial')}
        >
          Share feedback when you're ready
        </button>
      </div>
    </div>
  );
};

export const CompletedLabourPage: React.FC = () => {
  const { labourId } = useParams<{ labourId: string }>();
  const client = useLabourClient();
  const { data: labour, isPending, isError, error } = useLabourById(client, labourId || null);

  return (
    <AppShell>
      <div className={baseClasses.flexPageColumn}>
        {isPending ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader color="pink" />
          </div>
        ) : isError ? (
          <div>Error loading labour: {error?.message}</div>
        ) : labour ? (
          <CompletedLabourCard labour={labour} />
        ) : null}
      </div>
    </AppShell>
  );
};
