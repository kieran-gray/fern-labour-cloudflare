import { AppMode, useLabourSession } from '@base/contexts/LabourSessionContext';
import { MotherView } from '@base/pages/Home/MotherView';
import { SubscriberView } from '@base/pages/Home/SubscriberView';
import { SelectAppMode } from './components/SelectAppMode';

export const HomePage = () => {
  const { mode } = useLabourSession();

  if (mode === AppMode.Birth) {
    return <MotherView />;
  }

  if (mode === AppMode.Subscriber) {
    return <SubscriberView />;
  }

  return <SelectAppMode />;
};
