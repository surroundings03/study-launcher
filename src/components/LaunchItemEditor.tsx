import { useState } from 'react';
import type { FormEvent } from 'react';
import type { CreateUrlLaunchItemInput, Workflow } from '../shared/types';

type LaunchItemEditorProps = {
  onAddUrlLaunchItem(input: CreateUrlLaunchItemInput): Promise<Workflow | null>;
  onCancel(): void;
  onError(message: string): void;
};

export function LaunchItemEditor({
  onAddUrlLaunchItem,
  onCancel,
  onError
}: LaunchItemEditorProps) {
  const [urlTitle, setUrlTitle] = useState('');
  const [urlTarget, setUrlTarget] = useState('');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTitle = urlTitle.trim();
    const trimmedTarget = urlTarget.trim();

    if (!trimmedTitle) {
      onError('Launch item title is required.');
      return;
    }

    if (!trimmedTarget) {
      onError('URL is required.');
      return;
    }

    const updatedWorkflow = await onAddUrlLaunchItem({
      title: trimmedTitle,
      target: trimmedTarget
    });

    if (!updatedWorkflow) {
      return;
    }

    setUrlTitle('');
    setUrlTarget('');
    onCancel();
  };

  return (
    <form className="launch-item-form" onSubmit={handleSubmit}>
      <label className="field">
        <span>Title</span>
        <input
          value={urlTitle}
          onChange={(event) => setUrlTitle(event.target.value)}
          placeholder="ChatGPT"
        />
      </label>
      <label className="field">
        <span>URL</span>
        <input
          value={urlTarget}
          onChange={(event) => setUrlTarget(event.target.value)}
          placeholder="https://chat.openai.com/"
        />
      </label>
      <div className="form-actions">
        <button className="secondary-button" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="accent-button" type="submit">
          Add URL
        </button>
      </div>
    </form>
  );
}
