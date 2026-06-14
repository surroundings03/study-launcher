import { useEffect, useMemo, useRef, useState } from 'react';
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
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const incompleteTasks = useMemo(
    () => tasks.filter((task) => !task.completed),
    [tasks]
  );
  const trimmedTitle = title.trim();

  useEffect(() => {
    if (isInputOpen) {
      inputRef.current?.focus();
    }
  }, [isInputOpen]);

  const handleToggleInput = () => {
    setIsInputOpen((currentValue) => {
      if (currentValue) {
        setTitle('');
      }

      return !currentValue;
    });
  };

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
        setIsInputOpen(false);
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
          <p>Keep the next steps close to the workflow.</p>
        </div>
        <button
          className="panel-action"
          type="button"
          onClick={handleToggleInput}
          aria-label="Add Task"
        >
          <span aria-hidden="true">+</span>
          Add Task
        </button>
      </div>

      {isInputOpen && (
        <form className="task-form" onSubmit={handleAddTask}>
          <input
            ref={inputRef}
            className="task-input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Read section notes"
          />
        </form>
      )}

      {incompleteTasks.length > 0 ? (
        <ul className="task-list">
          {incompleteTasks.map((task) => (
            <li className="task-row" key={task.id}>
              <label className="task-check">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() =>
                    onSetTaskCompleted(workflowId, task.id, true)
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
          <strong>No open tasks</strong>
          <span>Add a task for this workflow.</span>
        </div>
      )}
    </section>
  );
}
