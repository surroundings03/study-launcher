import { useState } from 'react';
import type { FormEvent } from 'react';
import type {
  CreateLaunchItemInput,
  LaunchItemType,
  PickPathResult,
  Workflow
} from '../shared/types';

type LaunchItemEditorProps = {
  onAddLaunchItem(input: CreateLaunchItemInput): Promise<Workflow | null>;
  onCancel(): void;
  onError(message: string): void;
};

type LaunchItemOption = {
  label: string;
  type: LaunchItemType;
};

const launchItemOptions: LaunchItemOption[] = [
  { label: 'URL', type: 'url' },
  { label: 'File', type: 'file' },
  { label: 'Folder', type: 'folder' },
  { label: 'App', type: 'app' }
];

const getPickLabel = (type: LaunchItemType): string => {
  if (type === 'folder') {
    return 'Choose Folder';
  }

  if (type === 'app') {
    return 'Choose App';
  }

  return 'Choose File';
};

const getTargetLabel = (type: LaunchItemType): string =>
  type === 'url' ? 'URL' : 'Target';

const getTargetPlaceholder = (type: LaunchItemType): string => {
  if (type === 'url') {
    return 'https://chat.openai.com/';
  }

  if (type === 'folder') {
    return 'Choose a local folder';
  }

  if (type === 'app') {
    return 'Choose a local .exe application';
  }

  return 'Choose a local file';
};

export function LaunchItemEditor({
  onAddLaunchItem,
  onCancel,
  onError
}: LaunchItemEditorProps) {
  const [itemType, setItemType] = useState<LaunchItemType>('url');
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');

  const handleSelectType = (nextType: LaunchItemType) => {
    setItemType(nextType);
    setTitle('');
    setTarget('');
  };

  const handlePickTarget = async () => {
    try {
      let result: PickPathResult;

      if (itemType === 'folder') {
        result = await window.studyLauncher.pickFolder();
      } else if (itemType === 'app') {
        result = await window.studyLauncher.pickApp();
      } else {
        result = await window.studyLauncher.pickFile();
      }

      if (result.canceled === true) {
        return;
      }

      setTarget(result.path);
      setTitle(result.title);
    } catch (requestError) {
      onError(
        requestError instanceof Error
          ? requestError.message
          : 'Failed to choose target.'
      );
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedTarget = target.trim();

    if (!trimmedTitle) {
      onError('Launch item title is required.');
      return;
    }

    if (!trimmedTarget) {
      onError(
        itemType === 'url'
          ? 'URL is required.'
          : 'Choose a target before adding the launch item.'
      );
      return;
    }

    const updatedWorkflow = await onAddLaunchItem({
      title: trimmedTitle,
      type: itemType,
      target: trimmedTarget
    });

    if (!updatedWorkflow) {
      return;
    }

    setTitle('');
    setTarget('');
    setItemType('url');
    onCancel();
  };

  return (
    <form className="launch-item-form" onSubmit={handleSubmit}>
      <div className="field launch-type-field">
        <span>Type</span>
        <div className="launch-type-tabs" role="group" aria-label="Launch item type">
          {launchItemOptions.map((option) => (
            <button
              className={
                itemType === option.type
                  ? 'type-tab selected'
                  : 'type-tab'
              }
              key={option.type}
              type="button"
              onClick={() => handleSelectType(option.type)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <label className="field">
        <span>Title</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={itemType === 'url' ? 'ChatGPT' : 'Launch item title'}
        />
      </label>

      <label className="field">
        <span>{getTargetLabel(itemType)}</span>
        <input
          value={target}
          onChange={(event) => setTarget(event.target.value)}
          placeholder={getTargetPlaceholder(itemType)}
          readOnly={itemType !== 'url'}
        />
      </label>

      {itemType !== 'url' && (
        <div className="picker-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={handlePickTarget}
          >
            {getPickLabel(itemType)}
          </button>
        </div>
      )}

      <div className="form-actions">
        <button className="secondary-button" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="accent-button" type="submit">
          Add Item
        </button>
      </div>
    </form>
  );
}
