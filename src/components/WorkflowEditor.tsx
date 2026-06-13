import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { UpdateWorkflowInput, Workflow } from '../shared/types';

type WorkflowEditorProps = {
  workflow: Workflow;
  onCancel(): void;
  onSave(input: UpdateWorkflowInput): Promise<Workflow | null>;
};

export function WorkflowEditor({
  workflow,
  onCancel,
  onSave
}: WorkflowEditorProps) {
  const [name, setName] = useState(workflow.name);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    setName(workflow.name);
    setValidationError('');
  }, [workflow]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setValidationError('Workflow name is required.');
      return;
    }

    const updatedWorkflow = await onSave({
      name: trimmedName,
      description: workflow.description ?? ''
    });

    if (updatedWorkflow) {
      onCancel();
    }
  };

  return (
    <form className="workflow-edit-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>Name</span>
        <input
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setValidationError('');
          }}
          placeholder="Workflow name"
        />
      </label>
      {validationError && (
        <span className="inline-error" role="alert">
          {validationError}
        </span>
      )}
      <div className="form-actions">
        <button className="secondary-button" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="accent-button"
          type="submit"
          disabled={!name.trim()}
        >
          Save
        </button>
      </div>
    </form>
  );
}
