import { AppMode } from '@base/contexts/LabourSessionContext';
import { IconArrowUpRight, IconBabyCarriage, IconBulb, IconHeart } from '@tabler/icons-react';
import { Badge, Group, Text, ThemeIcon, UnstyledButton } from '@mantine/core';
import classes from './GuestModeSelect.module.css';
import baseClasses from '@styles/base.module.css';

interface GuestModeSelectProps {
  onModeSelect: (mode: AppMode) => void;
}

export function GuestModeSelect({ onModeSelect }: GuestModeSelectProps) {
  return (
    <div className={baseClasses.flexPageColumn}>
      <div className={baseClasses.card}>
        <div className={classes.container}>
          <header className={classes.header}>
            <Badge variant="light" radius="xl" className={classes.greetingBadge}>
              Welcome to Fern Labour
            </Badge>

            <h1 className={classes.title}>Choose your journey</h1>
            <p className={classes.subtitle}>
              Start tracking your labour or join someone you care about. You can switch modes any
              time.
            </p>
          </header>

          <div className={classes.optionsRow}>
            <UnstyledButton
              className={classes.modeTile}
              onClick={() => onModeSelect(AppMode.Birth)}
              aria-describedby="expecting-sub"
            >
              <ThemeIcon
                size={58}
                radius="xl"
                variant="light"
                color="pink"
                className={classes.tileIcon}
              >
                <IconBabyCarriage size={30} />
              </ThemeIcon>

              <div className={classes.tileContent}>
                <h3 className={classes.tileTitle}>I&apos;m expecting</h3>
                <Text size="sm" className={classes.tileSub} id="expecting-sub">
                  Track contractions, share updates, and keep your labour circle close.
                </Text>
              </div>

              <Group className={classes.tileMeta} justify="end" wrap="nowrap">
                <IconArrowUpRight className={classes.tileArrow} size={20} />
              </Group>
            </UnstyledButton>

            <UnstyledButton
              className={classes.modeTile}
              onClick={() => onModeSelect(AppMode.Subscriber)}
              aria-describedby="supporting-sub"
            >
              <ThemeIcon
                size={58}
                radius="xl"
                variant="light"
                color="blue"
                className={classes.tileIcon}
              >
                <IconHeart size={30} />
              </ThemeIcon>

              <div className={classes.tileContent}>
                <h3 className={classes.tileTitle}>I&apos;m supporting</h3>
                <Text size="sm" className={classes.tileSub} id="supporting-sub">
                  Follow progress in real time and be ready with support when it matters most.
                </Text>
              </div>

              <Group className={classes.tileMeta} justify="end" wrap="nowrap">
                <IconArrowUpRight className={classes.tileArrow} size={20} />
              </Group>
            </UnstyledButton>
          </div>

          <div className={classes.trustRow}>
            <span className={classes.trustItem}>
              <IconBulb className={classes.trustIcon} />
              <span className={classes.trustText}>
                No pressure. You can change this later in settings.
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
