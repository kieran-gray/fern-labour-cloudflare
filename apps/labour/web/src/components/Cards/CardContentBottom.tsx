import { ResponsiveDescription } from '@base/components/Text/ResponsiveDescription';
import { ResponsiveTitle } from '@base/components/Text/ResponsiveTitle';
import { Image } from '@mantine/core';
import classes from './CardContentBottom.module.css';
import baseClasses from '@styles/base.module.css';

interface CardProps {
  title: string;
  description: string;
  image?: string;
  mobileImage?: string;
  children?: React.ReactNode;
}

export function CardContentBottom({ title, description, image, mobileImage, children }: CardProps) {
  return (
    <div className={baseClasses.root}>
      <div className={baseClasses.body}>
        <div className={baseClasses.inner}>
          <div className={classes.content}>
            <ResponsiveTitle title={title} />
            <ResponsiveDescription description={description} marginTop={10} />
            {mobileImage && (
              <div className={classes.imageFlexRow}>
                <Image src={mobileImage} className={classes.mobileImage} />
              </div>
            )}
          </div>
          {image && (
            <div className={baseClasses.flexColumn}>
              <Image src={image} className={classes.image} />
            </div>
          )}
        </div>
        <div className={baseClasses.inner} style={{ paddingTop: 0, paddingBottom: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
