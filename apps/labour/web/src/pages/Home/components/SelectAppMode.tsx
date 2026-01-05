import { AppShell } from '@base/components/AppShell';
import { AppMode, useLabourSession } from '@base/contexts/LabourSessionContext';
import { IconBabyCarriage, IconBulb, IconChevronRight, IconHeart } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { Text, ThemeIcon } from '@mantine/core';
import classes from './SelectAppMode.module.css';
import baseClasses from '@styles/base.module.css';

export function SelectAppMode() {
  const navigate = useNavigate();
  const { setMode } = useLabourSession();

  const handleModeSelect = (selectedMode: AppMode) => {
    setMode(selectedMode);
    navigate('/');
  };

  return (
    <AppShell>
      <div className={baseClasses.flexPageColumn}>
        <div className={baseClasses.card}>
          <div className={classes.container}>
            <header className={classes.header}>
              <div className={classes.headerDecoration} />
              <p className={classes.greeting}>Welcome to Fern Labour</p>
              <h1 className={classes.title}>
                What brings you <span className={classes.titleAccent}>here</span> today?
              </h1>
              <p className={classes.subtitle}>
                Whether you're tracking your own labour journey or following and supporting someone
                special, you're in the right place.
              </p>
            </header>

            <div className={classes.optionsRow}>
              <div
                className={classes.modeTile}
                role="button"
                tabIndex={0}
                onClick={() => handleModeSelect(AppMode.Birth)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleModeSelect(AppMode.Birth);
                  }
                }}
                aria-describedby="expecting-sub"
              >
                <ThemeIcon
                  className={classes.primaryIcon}
                  size={56}
                  radius="xl"
                  variant="light"
                  color="pink"
                >
                  <IconBabyCarriage size={30} />
                </ThemeIcon>
                <h3 className={classes.tileTitle}>I'm expecting</h3>
                <Text size="sm" className={classes.tileSub} id="expecting-sub">
                  Track contractions, invite loved ones, share updates.
                </Text>
                <IconChevronRight className={classes.tileArrow} size={20} />
              </div>

              <div
                className={classes.modeTile}
                role="button"
                tabIndex={0}
                onClick={() => handleModeSelect(AppMode.Subscriber)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleModeSelect(AppMode.Subscriber);
                  }
                }}
                aria-describedby="supporting-sub"
              >
                <ThemeIcon
                  className={classes.supportIcon}
                  size={56}
                  radius="xl"
                  variant="light"
                  color="blue"
                >
                  <IconHeart size={30} />
                </ThemeIcon>
                <h3 className={classes.tileTitle}>I'm supporting</h3>
                <Text size="sm" className={classes.tileSub} id="supporting-sub">
                  Get timely updates and know how to help.
                </Text>
                <IconChevronRight className={classes.tileArrow} size={20} />
              </div>
            </div>

            <div className={classes.trustRow}>
              <span className={classes.trustItem}>
                <IconBulb className={classes.trustIcon} />
                <span className={classes.trustText}>
                  You can switch between modes anytime in the app settings
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
