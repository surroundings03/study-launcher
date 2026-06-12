import { useState } from 'react';
import type { FormEvent } from 'react';
import type { CreateWorkflowInput, Workflow } from '../shared/types';

type SidebarProps = {
  workflows: Workflow[];
  selectedWorkflowId: string | null;
  onCreateWorkflow(input: CreateWorkflowInput): Promise<Workflow | null>;
  onDeleteWorkflow(workflow: Workflow): void;
  onSelectWorkflow(workflowId: string): void;
  onError(message: string): void;
};

const getWorkflowInitial = (name: string): string =>
  name.trim().charAt(0).toUpperCase() || 'S';

export function Sidebar({
  workflows,
  selectedWorkflowId,
  onCreateWorkflow,
  onDeleteWorkflow,
  onSelectWorkflow,
  onError
}: SidebarProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);

  const handleCreateWorkflow = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      onError('Workflow name is required.');
      return;
    }

    const workflow = await onCreateWorkflow({
      name: trimmedName,
      description
    });

    if (!workflow) {
      return;
    }

    setName('');
    setDescription('');
    setIsCreateFormOpen(false);
  };

  return (
    <aside className="sidebar" aria-label="Workflow navigation">
      <div className="sidebar-heading">
        <h2>Workflows</h2>
        <button
          className="new-workflow-button"
          type="button"
          onClick={() => setIsCreateFormOpen((currentValue) => !currentValue)}
        >
          <span aria-hidden="true">+</span>
          New
        </button>
      </div>

      {isCreateFormOpen && (
        <form className="workflow-form" onSubmit={handleCreateWorkflow}>
          <label className="field">
            <span>Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Chapter review"
            />
          </label>
          <label className="field">
            <span>Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Notes, resources, and AI tools"
              rows={3}
            />
          </label>
          <div className="form-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() => setIsCreateFormOpen(false)}
            >
              Cancel
            </button>
            <button className="accent-button" type="submit">
              Create
            </button>
          </div>
        </form>
      )}

      <div className="workflow-list">
        {workflows.length > 0 ? (
          workflows.map((workflow) => {
            const isSelected = workflow.id === selectedWorkflowId;
            const workflowUrlCount = workflow.items.filter(
              (item) => item.type === 'url'
            ).length;

            return (
              <div
                className={isSelected ? 'workflow-row selected' : 'workflow-row'}
                key={workflow.id}
              >
                <button
                  className="workflow-select"
                  type="button"
                  onClick={() => onSelectWorkflow(workflow.id)}
                >
                  <span className="workflow-icon" aria-hidden="true">
                    {getWorkflowInitial(workflow.name)}
                  </span>
                  <span className="workflow-copy">
                    <strong>{workflow.name}</strong>
                    <span>
                      {workflowUrlCount} URL item
                      {workflowUrlCount === 1 ? '' : 's'}
                    </span>
                  </span>
                </button>
                <button
                  className="row-action danger"
                  type="button"
                  onClick={() => onDeleteWorkflow(workflow)}
                  aria-label={`Delete ${workflow.name}`}
                >
                  Delete
                </button>
              </div>
            );
          })
        ) : (
          <div className="empty-state compact">
            <strong>No workflows yet</strong>
            <span>Create your first study workflow.</span>
          </div>
        )}
      </div>

      <div className="storage-status" aria-label="Storage status">
        <span className="status-check" aria-hidden="true">
          OK
        </span>
        <span>
          <strong>Local data saved</strong>
          <small>Data is stored on this device.</small>
        </span>
      </div>
    </aside>
  );
}
