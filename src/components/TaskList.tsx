import { useState } from 'react';
import type { FormEvent } from 'react';
import type { CreateTaskInput, Task, Workflow } from '../shared/types';

type TaskListProps = {
  tasks: Task[];
  workflowId: string;
  onAddTask(
    workflowId: string,
    input: CreateTaskInput
  ): Promise<Workflow | null>;
  onDeleteTask(workflowId: string, taskId: string): Promise<Workflow | null>;
  onSetTaskCompleted(
    workflowId: string,
    taskId: string,
    completed: boolean
  ): Promise<Workflow | null>;
};

export function TaskList({
  tasks,
  workflowId,
  onAddTask,
  onDeleteTask,
  onSetTaskCompleted
}: TaskListProps) {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const trimmedTitle = title.trim();

  const handleAddTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!trimmedTitle || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const workflow = await onAddTask(workflowId, {
        title: trimmedTitle
      });

      if (workflow) {
        setTitle('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="panel tasks-panel">
      <div className="panel-header">
        <div>
          <h2>Tasks</h2>
          <p>Keep the next study steps close to the workflow.</p>
        </div>
      </div>

      <form className="task-form" onSubmit={handleAddTask}>
        <label className="field task-title-field">
          <span>Task</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Read section notes"
          />
        </label>
        <button
          className="panel-action"
          type="submit"
          disabled={!trimmedTitle || isSubmitting}
        >
          Add Task
        </button>
      </form>

      {tasks.length > 0 ? (
        <ul className="task-list">
          {tasks.map((task) => (
            <li
              className={task.completed ? 'task-row completed' : 'task-row'}
              key={task.id}
            >
              <label className="task-check">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={(event) =>
                    onSetTaskCompleted(
                      workflowId,
                      task.id,
                      event.target.checked
                    )
                  }
                />
                <span aria-hidden="true" />
              </label>
              <span className="task-title">{task.title}</span>
              <button
                className="row-action danger"
                type="button"
                onClick={() => onDeleteTask(workflowId, task.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state compact">
          <strong>No tasks yet</strong>
          <span>Add a task for this workflow.</span>
        </div>
      )}
    </section>
  );
}
