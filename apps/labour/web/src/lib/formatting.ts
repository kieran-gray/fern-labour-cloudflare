export const dueDateToGestationalAge = (dueDate: Date) => {
  const today = new Date().getTime();
  const resultDate = new Date();
  const fortyWeeksInMs = 40 * 7 * 24 * 60 * 60 * 1000;
  resultDate.setTime(dueDate.getTime() - fortyWeeksInMs);

  const diffInMs = Math.abs(today - resultDate.getTime());
  const totalDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;

  return `${weeks}w + ${days}d`;
};

export const formatTimeMilliseconds = (milliseconds: number) => {
  if (milliseconds === 0) {
    return null;
  }
  const seconds = Math.floor(milliseconds / 1000);
  return formatTimeSeconds(seconds);
};

export const formatTimeSeconds = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds - h * 3600) / 60);
  const s = Math.floor(seconds - h * 3600 - m * 60);
  const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return timeString.startsWith('00') ? timeString.substring(3) : timeString;
};

export const formatDurationHuman = (totalSeconds: number): string => {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return '0 seconds';
  }

  const seconds = Math.floor(totalSeconds);
  const totalHours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (totalHours > 0) {
    const hourLabel = totalHours === 1 ? 'hr' : 'hrs';
    if (minutes > 0) {
      return `${totalHours} ${hourLabel} ${minutes} min`;
    }
    return `${totalHours} ${hourLabel}`;
  }

  if (minutes > 0) {
    return `${minutes} min`;
  }

  return `${secs} sec`;
};

export function pluraliseName(name: string): string {
  return name.endsWith('s') ? `${name}'` : `${name}'s`;
}

export function formatDateTime(date: Date): string {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = date.toDateString() === new Date(now.getTime() - 86400000).toDateString();

  const timeStr = date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (isToday) {
    return `Today at ${timeStr}`;
  }
  if (isYesterday) {
    return `Yesterday at ${timeStr}`;
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
