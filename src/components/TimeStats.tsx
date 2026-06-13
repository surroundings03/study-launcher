import type { ActiveSession, StudySession, Workflow } from '../shared/types';

type TimeStatsProps = {
  activeSession: ActiveSession;
  activeWorkflowName: string | null;
  currentElapsedSeconds: number;
  isWorkflowRunning: boolean;
  workflow: Workflow;
};

const getSafeDurationSeconds = (durationSeconds: number): number =>
  Number.isFinite(durationSeconds) ? Math.max(0, Math.floor(durationSeconds)) : 0;

const formatTimer = (durationSeconds: number): string => {
  const safeSeconds = getSafeDurationSeconds(durationSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, '0'))
    .join(':');
};

const formatCompactDuration = (durationSeconds: number): string => {
  const safeSeconds = getSafeDurationSeconds(durationSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
};

const isToday = (isoString: string): boolean => {
  const date = new Date(isoString);

  if (!Number.isFinite(date.getTime())) {
    return false;
  }

  const today = new Date();

  return date.toDateString() === today.toDateString();
};

const sumDurationSeconds = (sessions: StudySession[]): number =>
  sessions.reduce(
    (totalSeconds, session) =>
      totalSeconds + getSafeDurationSeconds(session.durationSeconds),
    0
  );

export function TimeStats({
  activeSession,
  activeWorkflowName,
  currentElapsedSeconds,
  isWorkflowRunning,
  workflow
}: TimeStatsProps) {
  const completedTodaySeconds = sumDurationSeconds(
    workflow.sessions.filter((session) => isToday(session.endedAt))
  );
  const currentWorkflowSeconds = isWorkflowRunning ? currentElapsedSeconds : 0;
  const todaySeconds = completedTodaySeconds + currentWorkflowSeconds;
  const totalSeconds = sumDurationSeconds(workflow.sessions) + currentWorkflowSeconds;
  const currentLabel = isWorkflowRunning
    ? 'Current Session'
    : activeSession
      ? 'Another Workflow Active'
      : 'Current Session';
  const currentCopy = isWorkflowRunning
    ? 'Session in progress'
    : activeSession
      ? activeWorkflowName ?? 'A workflow is running'
      : 'No active session';

  return (
    <section className="panel study-panel">
      <div className="panel-header">
        <div>
          <h2>Study Time</h2>
          <p>{currentCopy}</p>
        </div>
      </div>
      <div className="time-stack">
        <div className="timer-block">
          <span>{currentLabel}</span>
          <strong>{formatTimer(currentWorkflowSeconds)}</strong>
        </div>
        <div className="metric-row">
          <span>Today</span>
          <strong>{formatCompactDuration(todaySeconds)}</strong>
        </div>
        <div className="metric-row">
          <span>Total</span>
          <strong>{formatCompactDuration(totalSeconds)}</strong>
        </div>
      </div>
    </section>
  );
}
