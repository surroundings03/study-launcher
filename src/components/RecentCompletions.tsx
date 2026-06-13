import { useMemo } from 'react';
import type { Task } from '../shared/types';

type RecentCompletionsProps = {
  tasks: Task[];
};

type CompletedTask = {
  task: Task;
  completedAtMs: number;
  completedTime: string;
};

const formatCompletedTime = (completedAt: string): string => {
  const date = new Date(completedAt);

  if (!Number.isFinite(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export function RecentCompletions({ tasks }: RecentCompletionsProps) {
  const completedTasks = useMemo<CompletedTask[]>(
    () =>
      tasks
        .filter((task) => task.completed && typeof task.completedAt === 'string')
        .map((task) => {
          const completedAt = task.completedAt ?? '';
          const completedAtMs = new Date(completedAt).getTime();
          const completedTime = formatCompletedTime(completedAt);

          return {
            task,
            completedAtMs,
            completedTime
          };
        })
        .filter(
          (completedTask) =>
            Number.isFinite(completedTask.completedAtMs) &&
            completedTask.completedTime
        )
        .sort(
          (firstTask, secondTask) =>
            secondTask.completedAtMs - firstTask.completedAtMs
        )
        .slice(0, 5),
    [tasks]
  );

  return (
    <section className="panel completions-panel">
      <div className="panel-header">
        <div>
          <h2>Recent Completions</h2>
          <p>Latest completed tasks from this workflow.</p>
        </div>
      </div>

      {completedTasks.length > 0 ? (
        <ol className="completion-timeline">
          {completedTasks.map(({ task, completedTime }) => (
            <li className="completion-row" key={task.id}>
              <span className="timeline-marker" aria-hidden="true" />
              <div className="completion-copy">
                <time>{completedTime}</time>
                <strong>{task.title}</strong>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="empty-state compact">
          <strong>No completed tasks yet.</strong>
        </div>
      )}
    </section>
  );
}
