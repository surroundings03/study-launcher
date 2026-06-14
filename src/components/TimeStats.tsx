import {
  formatCompactDuration,
  formatTimerDuration,
  getStudySessionDurationSeconds,
  isLocalToday
} from '../shared/time';
import type { ActiveSession, Workflow } from '../shared/types';

type TimeStatsProps = {
  activeSession: ActiveSession;
  activeWorkflowName: string | null;
  currentElapsedSeconds: number;
  isWorkflowRunning: boolean;
  workflow: Workflow;
};

const sumDurationSeconds = (sessions: Workflow['sessions']): number =>
  sessions.reduce(
    (totalSeconds, session) =>
      totalSeconds + getStudySessionDurationSeconds(session),
    0
  );

export function TimeStats({
  activeSession,
  activeWorkflowName,
  currentElapsedSeconds,
  isWorkflowRunning,
  workflow
}: TimeStatsProps) {
  const sessions = Array.isArray(workflow.sessions) ? workflow.sessions : [];
  const completedTodaySeconds = sumDurationSeconds(
    sessions.filter((session) => isLocalToday(session.endedAt))
  );
  const currentWorkflowSeconds = isWorkflowRunning ? currentElapsedSeconds : 0;
  const totalSeconds = sumDurationSeconds(sessions);
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
          <h2>Time</h2>
          <p>{currentCopy}</p>
        </div>
      </div>
      <div className="time-stack">
        <div className="timer-block">
          <span>{currentLabel}</span>
          <strong>{formatTimerDuration(currentWorkflowSeconds)}</strong>
        </div>
        <div className="metric-row">
          <span>Today</span>
          <strong>{formatCompactDuration(completedTodaySeconds)}</strong>
        </div>
        <div className="metric-row">
          <span>Total</span>
          <strong>{formatCompactDuration(totalSeconds)}</strong>
        </div>
      </div>
    </section>
  );
}
