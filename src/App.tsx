import { useMemo, useState } from 'react';
import { AppShell } from './components/AppShell';
import { Sidebar } from './components/Sidebar';
import { WorkflowDetail } from './components/WorkflowDetail';
import { useWorkflows } from './hooks/useWorkflows';
import type { CreateLaunchItemInput, LaunchItem } from './shared/types';

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const sortLaunchItemsByOrder = (items: LaunchItem[]): LaunchItem[] =>
  [...items].sort((firstItem, secondItem) => {
    if (firstItem.order !== secondItem.order) {
      return firstItem.order - secondItem.order;
    }

    return firstItem.createdAt.localeCompare(secondItem.createdAt);
  });

export default function App() {
  const {
    workflows,
    selectedWorkflow,
    selectedWorkflowId,
    error,
    setError,
    selectWorkflow,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    replaceWorkflow
  } = useWorkflows();
  const [isStarting, setIsStarting] = useState(false);

  const launchItems = useMemo(
    () =>
      selectedWorkflow
        ? sortLaunchItemsByOrder(
            selectedWorkflow.items
          )
        : [],
    [selectedWorkflow]
  );

  const enabledLaunchItems = useMemo(
    () => launchItems.filter((launchItem) => launchItem.enabled),
    [launchItems]
  );

  const handleAddLaunchItem = async (input: CreateLaunchItemInput) => {
    if (!selectedWorkflow) {
      setError('Select a workflow before adding a launch item.');
      return null;
    }

    try {
      const updatedWorkflow = await window.studyLauncher.addLaunchItem(
        selectedWorkflow.id,
        input
      );

      replaceWorkflow(updatedWorkflow);
      setError('');

      return updatedWorkflow;
    } catch (requestError) {
      setError(getErrorMessage(requestError) || 'Failed to add launch item.');
      return null;
    }
  };

  const handleLaunchItem = async (launchItem: LaunchItem) => {
    if (!selectedWorkflow) {
      setError('Select a workflow before launching an item.');
      return;
    }

    try {
      await window.studyLauncher.launchLaunchItem(
        selectedWorkflow.id,
        launchItem.id
      );
      setError('');
    } catch (requestError) {
      setError(getErrorMessage(requestError) || 'Unable to open launch item.');
    }
  };

  const handleStartStudy = async () => {
    if (!selectedWorkflow) {
      setError('Select a workflow before starting study.');
      return;
    }

    if (enabledLaunchItems.length === 0) {
      setError('Add an enabled launch item before starting study.');
      return;
    }

    setIsStarting(true);

    try {
      for (const launchItem of enabledLaunchItems) {
        await window.studyLauncher.launchLaunchItem(
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

      replaceWorkflow(updatedWorkflow);
      setError('');
    } catch (requestError) {
      setError(getErrorMessage(requestError) || 'Failed to delete item.');
    }
  };

  return (
    <AppShell
      sidebar={
        <Sidebar
          workflows={workflows}
          selectedWorkflowId={selectedWorkflowId}
          onCreateWorkflow={createWorkflow}
          onDeleteWorkflow={deleteWorkflow}
          onError={setError}
          onSelectWorkflow={selectWorkflow}
        />
      }
    >
      {error && (
        <div className="app-alert" role="alert">
          {error}
        </div>
      )}

      {selectedWorkflow ? (
        <WorkflowDetail
          workflow={selectedWorkflow}
          enabledLaunchItemCount={enabledLaunchItems.length}
          isStarting={isStarting}
          launchItems={launchItems}
          onAddLaunchItem={handleAddLaunchItem}
          onDeleteLaunchItem={handleDeleteLaunchItem}
          onDeleteWorkflow={deleteWorkflow}
          onError={setError}
          onLaunchItem={handleLaunchItem}
          onStartStudy={handleStartStudy}
          onUpdateWorkflow={updateWorkflow}
        />
      ) : (
        <section className="panel no-workflow">
          <div className="empty-state">
            <strong>No workflow selected</strong>
            <span>Create a workflow from the sidebar to begin.</span>
          </div>
        </section>
      )}
    </AppShell>
  );
}
