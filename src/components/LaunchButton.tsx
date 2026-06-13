import { formatTimerDuration } from '../shared/time';

type LaunchButtonProps = {
  enabledLaunchItemCount: number;
  isAnotherWorkflowRunning: boolean;
  isLaunching: boolean;
  isRunning: boolean;
  timerSeconds: number;
  disabled: boolean;
  onStart(): void;
};

export function LaunchButton({
  enabledLaunchItemCount,
  isAnotherWorkflowRunning,
  isLaunching,
  isRunning,
  timerSeconds,
  disabled,
  onStart
}: LaunchButtonProps) {
  const buttonLabel = isRunning ? 'Stop' : isLaunching ? 'Opening' : 'Start';
  const statusLabel = isRunning
    ? 'Running'
    : isLaunching
      ? 'Opening'
      : isAnotherWorkflowRunning
        ? 'Blocked'
        : 'Ready';
  const statusCopy = isRunning
    ? formatTimerDuration(timerSeconds)
    : isLaunching
      ? 'Launching in order'
      : isAnotherWorkflowRunning
        ? 'Stop active workflow first'
        : enabledLaunchItemCount > 0
          ? 'Not running'
          : 'No enabled items';

  return (
    <div className="hero-actions">
      <button
        className={isRunning ? 'start-button running' : 'start-button'}
        type="button"
        disabled={disabled}
        onClick={onStart}
      >
        <span
          className={isRunning ? 'stop-glyph' : 'play-glyph'}
          aria-hidden="true"
        />
        {buttonLabel}
      </button>

      <div className="run-status">
        <span className="status-dot" aria-hidden="true" />
        <strong>{statusLabel}</strong>
        <span>{statusCopy}</span>
      </div>
    </div>
  );
}
