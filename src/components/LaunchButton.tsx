type LaunchButtonProps = {
  isStarting: boolean;
  disabled: boolean;
  onStart(): void;
};

export function LaunchButton({
  isStarting,
  disabled,
  onStart
}: LaunchButtonProps) {
  return (
    <div className="hero-actions">
      <button
        className="start-button"
        type="button"
        disabled={disabled}
        onClick={onStart}
      >
        <span className="play-glyph" aria-hidden="true" />
        {isStarting ? 'Opening URLs' : 'Start'}
      </button>

      <div className="run-status">
        <span className="status-dot" aria-hidden="true" />
        <strong>{isStarting ? 'Opening' : 'Ready'}</strong>
        <span>{isStarting ? 'Launching in order' : 'Not running'}</span>
      </div>
    </div>
  );
}
