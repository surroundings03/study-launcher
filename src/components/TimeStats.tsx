export function TimeStats() {
  return (
    <section className="panel study-panel">
      <div className="panel-header">
        <div>
          <h2>Study Time</h2>
          <p>Placeholder only.</p>
        </div>
      </div>
      <div className="time-stack">
        <div className="timer-block">
          <span>Current Session</span>
          <strong>00:00:00</strong>
        </div>
        <div className="metric-row">
          <span>Today</span>
          <strong>0m</strong>
        </div>
        <div className="metric-row">
          <span>Total</span>
          <strong>0m</strong>
        </div>
      </div>
    </section>
  );
}
