type LaunchButtonProps = {
  enabledLaunchItemCount: number;
  isAnotherWorkflowRunning: boolean;
  isLaunching: boolean;
  isRunning: boolean;
  timerSeconds: number;
  disabled: boolean;
  onStart(): void;
};

const formatTimer = (durationSeconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(durationSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, '0'))
    .join(':');
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
    ? formatTimer(timerSeconds)
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
