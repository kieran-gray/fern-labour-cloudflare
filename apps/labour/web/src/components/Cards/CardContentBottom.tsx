import { Image, Text, Title } from '@mantine/core';
import classes from './CardContentBottom.module.css';
import baseClasses from '@styles/base.module.css';

interface CardProps {
  title: string;
  description: string;
  image?: string;
  mobileImage?: string;
  children?: React.ReactNode;
  helpButton?: React.ReactNode;
}

export function CardContentBottom({
  title,
  description,
  image,
  mobileImage,
  children,
  helpButton,
}: CardProps) {
  return (
    <div className={baseClasses.root}>
      <div className={baseClasses.body}>
        {helpButton ? (
          <>
            <div className={baseClasses.docsTitleRow}>
              <div className={classes.title}>
                <Title order={2} fz={{ base: 'h4', xs: 'h3', sm: 'h2' }}>
                  {title}
                </Title>
              </div>
              {helpButton}
            </div>
            <div className={baseClasses.inner} style={{ paddingTop: 0 }}>
              <div className={classes.content}>
                <Text fz={{ base: 'sm', sm: 'md' }} className={baseClasses.description}>
                  {description}
                </Text>
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
          </>
        ) : (
          <div className={baseClasses.inner}>
            <div className={classes.content}>
              <Title order={2} fz={{ base: 'h4', xs: 'h3', sm: 'h2' }}>
                {title}
              </Title>
              <Text fz={{ base: 'sm', sm: 'md' }} className={baseClasses.description} mt={10}>
                {description}
              </Text>
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
        )}
        <div className={baseClasses.inner} style={{ paddingTop: 0, paddingBottom: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
