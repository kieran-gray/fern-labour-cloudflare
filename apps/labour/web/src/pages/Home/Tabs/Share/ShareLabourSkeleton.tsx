import { Skeleton } from '@mantine/core';
import classes from './ShareLabour.module.css';
import skeletonClasses from './ShareLabourSkeleton.module.css';

function ShareCardSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className={classes.shareCard}>
      <div className={classes.shareCardHeader}>
        <Skeleton circle width={18} height={18} />
        <Skeleton height={14} width={80} radius="sm" />
      </div>
      <div className={classes.shareCardContent}>{children}</div>
    </div>
  );
}

function LinkCardSkeleton() {
  return (
    <ShareCardSkeleton>
      <div className={skeletonClasses.linkInputSkeleton}>
        <Skeleton height={12} radius="sm" style={{ flex: 1 }} />
        <div className={skeletonClasses.linkActionsSkeleton}>
          <Skeleton circle width={28} height={28} />
          <Skeleton circle width={28} height={28} />
        </div>
      </div>
    </ShareCardSkeleton>
  );
}

function SocialButtonsSkeleton() {
  return (
    <ShareCardSkeleton>
      <div className={skeletonClasses.socialButtonsSkeleton}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} circle width={42} height={42} />
        ))}
      </div>
    </ShareCardSkeleton>
  );
}

function QRCodeSkeleton() {
  return (
    <ShareCardSkeleton>
      <div className={skeletonClasses.qrCodeSkeleton}>
        <Skeleton width={180} height={180} radius="sm" />
      </div>
      <Skeleton height={10} width={100} radius="sm" mt="xs" mx="auto" />
    </ShareCardSkeleton>
  );
}

export function ShareLabourSkeleton() {
  return (
    <div className={classes.shareContent}>
      <div className={classes.shareCardsGrid}>
        <LinkCardSkeleton />
        <SocialButtonsSkeleton />
        <QRCodeSkeleton />
      </div>
      <Skeleton height={12} width={280} radius="sm" mt="md" mx="auto" />
    </div>
  );
}
