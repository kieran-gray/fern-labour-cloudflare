import { ContractionReadModel } from '@base/clients/labour_service/types';

export const formatClockTime = (iso: string): string =>
  new Date(iso)
    .toLocaleTimeString(navigator.language, {
      hour: '2-digit',
      minute: '2-digit',
    })
    .slice(0, 5);

export const formatTimeSince = (isoDate: string): string => {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) {
    return 'just now';
  }
  if (diffMins === 1) {
    return '1 min ago';
  }
  if (diffMins < 60) {
    return `${diffMins} min ago`;
  }

  const hours = Math.floor(diffMins / 60);
  if (hours === 1) {
    return '1 hour ago';
  }
  return `${hours} hours ago`;
};

export const isContractionActive = (c: ContractionReadModel): boolean =>
  c.duration.start_time === c.duration.end_time;

export const isContractionComplete = (c: ContractionReadModel): boolean =>
  c.duration.start_time !== c.duration.end_time;

export const getIntensityLabel = (intensity: number | null): string => {
  if (intensity === null) {
    return 'Not recorded';
  }
  if (intensity <= 3) {
    return 'Mild';
  }
  if (intensity <= 7) {
    return 'Moderate';
  }
  return 'Strong';
};

export const getIntensityColor = (intensity: number | null): string => {
  const value = intensity ?? 0;
  if (value <= 3) {
    return '#ff7964';
  }
  if (value <= 6) {
    return '#fe5236';
  }
  if (value <= 8) {
    return '#ff2a09';
  }
  return '#cb1500';
};

export interface ContractionFormData {
  contractionId: string;
  startTime: string;
  endTime: string;
  intensity: number | null;
}

export const toFormData = (c: ContractionReadModel): ContractionFormData => ({
  contractionId: c.contraction_id,
  startTime: c.duration.start_time,
  endTime: c.duration.end_time,
  intensity: c.intensity,
});
