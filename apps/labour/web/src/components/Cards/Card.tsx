import { ResponsiveDescription } from '@base/components/Text/ResponsiveDescription';
import { ResponsiveTitle } from '@base/components/Text/ResponsiveTitle';
import { Image } from '@mantine/core';
import classes from './Card.module.css';
import baseClasses from '@styles/base.module.css';

interface ImageConfig {
  src: string;
  width?: number;
  height?: number;
}

interface CardProps {
  title?: string;
  description?: React.ReactNode;
  headerActions?: React.ReactNode;
  image?: ImageConfig;
  imagePosition?: 'left' | 'right';
  mobileImage?: ImageConfig;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

export function Card({
  title,
  description,
  headerActions,
  image,
  imagePosition = 'right',
  mobileImage,
  footer,
  children,
}: CardProps) {
  const hasHeader = title || headerActions;

  const imageElement = image && (
    <Image
      src={image.src}
      w={image.width ?? 300}
      h={image.height ?? 'auto'}
      className={classes.image}
    />
  );

  const contentElement = (
    <div className={classes.content}>
      {hasHeader && (
        <div className={classes.header}>
          {title && <ResponsiveTitle title={title} />}
          {headerActions && <div className={classes.headerActions}>{headerActions}</div>}
        </div>
      )}
      {description && <ResponsiveDescription description={description} marginTop={10} />}
      {mobileImage && (
        <div className={classes.mobileImageContainer}>
          <Image src={mobileImage.src} w={mobileImage.width ?? 300} h={mobileImage.height ?? 250} />
        </div>
      )}
      {children}
    </div>
  );

  return (
    <div className={baseClasses.card}>
      <div className={classes.row}>
        {imagePosition === 'left' && imageElement}
        {contentElement}
        {imagePosition === 'right' && imageElement}
      </div>
      {footer && <div className={classes.footer}>{footer}</div>}
    </div>
  );
}
