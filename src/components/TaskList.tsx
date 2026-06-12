export function TaskList() {
  return (
    <section className="panel tasks-panel">
      <div className="panel-header">
        <div>
          <h2>Tasks</h2>
          <p>Task data is not implemented in this phase.</p>
        </div>
        <button className="panel-action" type="button" disabled>
          Add Task
        </button>
      </div>
      <div className="empty-state">
        <strong>Task list will be available later</strong>
        <span>No task actions are active yet.</span>
      </div>
    </section>
  );
}
