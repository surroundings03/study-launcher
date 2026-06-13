import type { StudySession } from './types';

type StudySessionWithLegacyDuration = StudySession & {
  durationMs?: unknown;
};

const getSafeDurationSeconds = (durationSeconds: unknown): number =>
  typeof durationSeconds === 'number' && Number.isFinite(durationSeconds)
    ? Math.max(0, Math.floor(durationSeconds))
    : 0;

const getSafeTimestamp = (dateLike: string): number => {
  const timestamp = new Date(dateLike).getTime();

  return Number.isFinite(timestamp) ? timestamp : Number.NaN;
};

export const formatTimerDuration = (durationSeconds: number): string => {
  const safeSeconds = getSafeDurationSeconds(durationSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, '0'))
    .join(':');
};

export const formatCompactDuration = (durationSeconds: number): string => {
  const safeSeconds = getSafeDurationSeconds(durationSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
};

export const isLocalToday = (dateLike: string): boolean => {
  const date = new Date(dateLike);

  if (!Number.isFinite(date.getTime())) {
    return false;
  }

  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

export const getStudySessionDurationSeconds = (
  session: StudySession
): number => {
  const durationSeconds = getSafeDurationSeconds(session.durationSeconds);

  if (durationSeconds > 0) {
    return durationSeconds;
  }

  const legacyDurationMs = (session as StudySessionWithLegacyDuration)
    .durationMs;

  if (typeof legacyDurationMs === 'number' && Number.isFinite(legacyDurationMs)) {
    return getSafeDurationSeconds(legacyDurationMs / 1000);
  }

  const startedAtMs = getSafeTimestamp(session.startedAt);
  const endedAtMs = getSafeTimestamp(session.endedAt);

  if (!Number.isFinite(startedAtMs) || !Number.isFinite(endedAtMs)) {
    return 0;
  }

  return getSafeDurationSeconds((endedAtMs - startedAtMs) / 1000);
};
