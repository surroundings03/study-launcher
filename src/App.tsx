import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { LaunchItem, Workflow } from './shared/types';

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const sortLaunchItemsByOrder = (items: LaunchItem[]): LaunchItem[] =>
  [...items].sort((firstItem, secondItem) => {
    if (firstItem.order !== secondItem.order) {
      return firstItem.order - secondItem.order;
    }

    return firstItem.createdAt.localeCompare(secondItem.createdAt);
  });

const formatOrder = (order: number): string =>
  Number.isFinite(order) ? String(order).padStart(2, '0') : '--';

const getWorkflowInitial = (name: string): string =>
  name.trim().charAt(0).toUpperCase() || 'S';

export default function App() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(
    null
  );
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const [urlTarget, setUrlTarget] = useState('');
  const [error, setError] = useState('');
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isAddItemFormOpen, setIsAddItemFormOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const selectedWorkflow = useMemo(
    () =>
      workflows.find((workflow) => workflow.id === selectedWorkflowId) ?? null,
    [selectedWorkflowId, workflows]
  );

  const urlLaunchItems = useMemo(
    () =>
      selectedWorkflow
        ? sortLaunchItemsByOrder(
            selectedWorkflow.items.filter((item) => item.type === 'url')
          )
        : [],
    [selectedWorkflow]
  );

  const enabledLaunchItems = useMemo(
    () => urlLaunchItems.filter((launchItem) => launchItem.enabled),
    [urlLaunchItems]
  );

  useEffect(() => {
    window.studyLauncher
      .getWorkflows()
      .then((storedWorkflows) => {
        setWorkflows(storedWorkflows);
        setSelectedWorkflowId(storedWorkflows[0]?.id ?? null);
      })
      .catch((requestError) => {
        setError(getErrorMessage(requestError) || 'Failed to load workflows.');
      });
  }, []);

  const handleCreateWorkflow = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Workflow name is required.');
      return;
    }

    try {
      const workflow = await window.studyLauncher.createWorkflow({
        name: trimmedName,
        description
      });

      setWorkflows((currentWorkflows) => [...currentWorkflows, workflow]);
      setSelectedWorkflowId(workflow.id);
      setName('');
      setDescription('');
      setError('');
      setIsCreateFormOpen(false);
    } catch (requestError) {
      setError(getErrorMessage(requestError) || 'Failed to create workflow.');
    }
  };

  const handleDeleteWorkflow = async (workflowToDelete?: Workflow) => {
    const targetWorkflow = workflowToDelete ?? selectedWorkflow;

    if (!targetWorkflow) {
      return;
    }

    const shouldDelete = window.confirm(
      `Delete workflow "${targetWorkflow.name}"?`
    );

    if (!shouldDelete) {
      return;
    }

    try {
      const nextWorkflows = await window.studyLauncher.deleteWorkflow(
        targetWorkflow.id
      );

      setWorkflows(nextWorkflows);

      if (targetWorkflow.id === selectedWorkflowId) {
        setSelectedWorkflowId(nextWorkflows[0]?.id ?? null);
      }

      setError('');
    } catch (requestError) {
      setError(getErrorMessage(requestError) || 'Failed to delete workflow.');
    }
  };

  const handleAddUrlLaunchItem = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!selectedWorkflow) {
      setError('Select a workflow before adding a URL.');
      return;
    }

    const trimmedTitle = urlTitle.trim();
    const trimmedTarget = urlTarget.trim();

    if (!trimmedTitle) {
      setError('Launch item title is required.');
      return;
    }

    if (!trimmedTarget) {
      setError('URL is required.');
      return;
    }

    try {
      const updatedWorkflow = await window.studyLauncher.addUrlLaunchItem(
        selectedWorkflow.id,
        {
          title: trimmedTitle,
          target: trimmedTarget
        }
      );

      setWorkflows((currentWorkflows) =>
        currentWorkflows.map((workflow) =>
          workflow.id === updatedWorkflow.id ? updatedWorkflow : workflow
        )
      );
      setUrlTitle('');
      setUrlTarget('');
      setError('');
      setIsAddItemFormOpen(false);
    } catch (requestError) {
      setError(getErrorMessage(requestError) || 'Failed to add URL item.');
    }
  };

  const handleLaunchUrlLaunchItem = async (launchItem: LaunchItem) => {
    if (!selectedWorkflow) {
      setError('Select a workflow before launching an item.');
      return;
    }

    try {
      await window.studyLauncher.launchUrlLaunchItem(
        selectedWorkflow.id,
        launchItem.id
      );
      setError('');
    } catch (requestError) {
      setError(getErrorMessage(requestError) || 'Failed to open URL.');
    }
  };

  const handleStartStudy = async () => {
    if (!selectedWorkflow) {
      setError('Select a workflow before starting study.');
      return;
    }

    if (enabledLaunchItems.length === 0) {
      setError('Add an enabled URL launch item before starting study.');
      return;
    }

    setIsStarting(true);

    try {
      for (const launchItem of enabledLaunchItems) {
        await window.studyLauncher.launchUrlLaunchItem(
          selectedWorkflow.id,
          launchItem.id
        );
      }

      setError('');
    } catch (requestError) {
      setError(getErrorMessage(requestError) || 'Failed to start study.');
    } finally {
      setIsStarting(false);
    }
  };

  const handleDeleteLaunchItem = async (launchItem: LaunchItem) => {
    if (!selectedWorkflow) {
      setError('Select a workflow before deleting an item.');
      return;
    }

    const shouldDelete = window.confirm(
      `Delete launch item "${launchItem.title}"?`
    );

    if (!shouldDelete) {
      return;
    }

    try {
      const updatedWorkflow = await window.studyLauncher.deleteLaunchItem(
        selectedWorkflow.id,
        launchItem.id
      );

      setWorkflows((currentWorkflows) =>
        currentWorkflows.map((workflow) =>
          workflow.id === updatedWorkflow.id ? updatedWorkflow : workflow
        )
      );
      setError('');
    } catch (requestError) {
      setError(getErrorMessage(requestError) || 'Failed to delete item.');
    }
  };

  return (
    <div className="app-root">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            SL
          </span>
          <span className="brand-name">Study Launcher</span>
        </div>
        <div className="topbar-actions" aria-label="Application tools">
          <button className="toolbar-button" type="button" disabled>
            Import
          </button>
          <button className="toolbar-button" type="button" disabled>
            Export
          </button>
          <button className="toolbar-button" type="button" disabled>
            Settings
          </button>
        </div>
      </header>

      <main className="workspace">
        <aside className="sidebar" aria-label="Workflow navigation">
          <div className="sidebar-heading">
            <h2>Workflows</h2>
            <button
              className="new-workflow-button"
              type="button"
              onClick={() =>
                setIsCreateFormOpen((currentValue) => !currentValue)
              }
            >
              <span aria-hidden="true">+</span>
              New Workflow
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
                <button className="secondary-button" type="button" onClick={() => setIsCreateFormOpen(false)}>
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
                    className={
                      isSelected ? 'workflow-row selected' : 'workflow-row'
                    }
                    key={workflow.id}
                  >
                    <button
                      className="workflow-select"
                      type="button"
                      onClick={() => {
                        setSelectedWorkflowId(workflow.id);
                        setError('');
                      }}
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
                      onClick={() => handleDeleteWorkflow(workflow)}
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

        <section className="content">
          {error && (
            <div className="app-alert" role="alert">
              {error}
            </div>
          )}

          {selectedWorkflow ? (
            <>
              <section className="workflow-hero">
                <div className="hero-copy">
                  <div className="hero-title-row">
                    <h1>{selectedWorkflow.name}</h1>
                    <button
                      className="icon-text-button"
                      type="button"
                      disabled
                      title="Workflow editing is not available in this phase."
                    >
                      Edit
                    </button>
                    <button
                      className="icon-text-button danger"
                      type="button"
                      onClick={() => handleDeleteWorkflow()}
                    >
                      Delete
                    </button>
                  </div>
                  <p>
                    {selectedWorkflow.description ||
                      'No description yet. Add URLs below to build the launch order.'}
                  </p>
                  <div className="hero-meta">
                    <span>{urlLaunchItems.length} URL launch items</span>
                    <span>{enabledLaunchItems.length} enabled</span>
                  </div>
                </div>

                <div className="hero-actions">
                  <button
                    className="start-button"
                    type="button"
                    disabled={enabledLaunchItems.length === 0 || isStarting}
                    onClick={handleStartStudy}
                  >
                    <span className="play-glyph" aria-hidden="true" />
                    {isStarting ? 'Opening URLs' : 'Start Study'}
                  </button>

                  <div className="run-status">
                    <span className="status-dot" aria-hidden="true" />
                    <strong>{isStarting ? 'Opening' : 'Ready'}</strong>
                    <span>{isStarting ? 'Launching in order' : 'Not running'}</span>
                  </div>
                </div>
              </section>

              <div className="dashboard-grid">
                <section className="panel launch-panel">
                  <div className="panel-header">
                    <div>
                      <h2>Launch Items</h2>
                      <p>Start Study opens enabled URL items in this order.</p>
                    </div>
                    <button
                      className="panel-action"
                      type="button"
                      onClick={() =>
                        setIsAddItemFormOpen((currentValue) => !currentValue)
                      }
                    >
                      <span aria-hidden="true">+</span>
                      Add Item
                    </button>
                  </div>

                  {isAddItemFormOpen && (
                    <form
                      className="launch-item-form"
                      onSubmit={handleAddUrlLaunchItem}
                    >
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
                        <button
                          className="secondary-button"
                          type="button"
                          onClick={() => setIsAddItemFormOpen(false)}
                        >
                          Cancel
                        </button>
                        <button className="accent-button" type="submit">
                          Add URL
                        </button>
                      </div>
                    </form>
                  )}

                  {urlLaunchItems.length > 0 ? (
                    <div className="launch-list">
                      {urlLaunchItems.map((launchItem) => (
                        <article
                          className={
                            launchItem.enabled
                              ? 'launch-row'
                              : 'launch-row disabled'
                          }
                          key={launchItem.id}
                        >
                          <span className="order-badge" aria-label="Launch order">
                            {formatOrder(launchItem.order)}
                          </span>
                          <div className="launch-main">
                            <div className="launch-title-line">
                              <strong>{launchItem.title}</strong>
                              <span className="type-badge">URL</span>
                            </div>
                            <span
                              className="launch-target"
                              title={launchItem.target}
                            >
                              {launchItem.target}
                            </span>
                          </div>
                          <div className="launch-actions">
                            <span
                              className={
                                launchItem.enabled
                                  ? 'toggle-indicator on'
                                  : 'toggle-indicator'
                              }
                              role="switch"
                              aria-checked={launchItem.enabled}
                              aria-disabled="true"
                              title="Enable state is read-only in this phase."
                            >
                              <span aria-hidden="true" />
                            </span>
                            <button
                              className="secondary-button"
                              type="button"
                              disabled={!launchItem.enabled}
                              onClick={() =>
                                handleLaunchUrlLaunchItem(launchItem)
                              }
                            >
                              Open
                            </button>
                            <button
                              className="row-action danger"
                              type="button"
                              onClick={() => handleDeleteLaunchItem(launchItem)}
                            >
                              Delete
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <strong>No launch items yet</strong>
                      <span>Add a URL item to define the study start order.</span>
                    </div>
                  )}
                </section>

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

                <section className="panel completions-panel">
                  <div className="panel-header">
                    <div>
                      <h2>Recent Completions</h2>
                      <p>Placeholder only.</p>
                    </div>
                  </div>
                  <div className="empty-state">
                    <strong>No completions yet</strong>
                    <span>Completion history will appear in a later phase.</span>
                  </div>
                </section>
              </div>
            </>
          ) : (
            <section className="panel no-workflow">
              <div className="empty-state">
                <strong>No workflow selected</strong>
                <span>Create a workflow from the sidebar to begin.</span>
              </div>
            </section>
          )}
        </section>
      </main>
    </div>
  );
}
