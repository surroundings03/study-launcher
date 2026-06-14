import { useEffect, useMemo, useState } from 'react';
import { AppShell } from './components/AppShell';
import { Sidebar } from './components/Sidebar';
import { WorkflowDetail } from './components/WorkflowDetail';
import { useWorkflows } from './hooks/useWorkflows';
import type {
  ActiveSession,
  CreateLaunchItemInput,
  LaunchItem,
  LaunchResult
} from './shared/types';

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const sortLaunchItemsByOrder = (items: LaunchItem[]): LaunchItem[] =>
  [...items].sort((firstItem, secondItem) => {
    if (firstItem.order !== secondItem.order) {
      return firstItem.order - secondItem.order;
    }

    return firstItem.createdAt.localeCompare(secondItem.createdAt);
  });

const sortLaunchResultsByOrder = (
  launchResults: LaunchResult[]
): LaunchResult[] =>
  [...launchResults].sort((firstResult, secondResult) => {
    if (firstResult.order !== secondResult.order) {
      return firstResult.order - secondResult.order;
    }

    return firstResult.title.localeCompare(secondResult.title);
  });

const getElapsedSeconds = (
  activeSession: ActiveSession,
  nowMs: number
): number => {
  if (!activeSession) {
    return 0;
  }

  const startedAtMs = new Date(activeSession.startedAt).getTime();

  if (!Number.isFinite(startedAtMs)) {
    return 0;
  }

  return Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
};

export default function App() {
  const {
    activeSession,
    addTask,
    applyAppData,
    deleteTask,
    workflows,
    selectedWorkflow,
    selectedWorkflowId,
    error,
    setError,
    selectWorkflow,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    replaceWorkflow,
    setActiveSession,
    setTaskCompleted
  } = useWorkflows();
  const [launchingWorkflowId, setLaunchingWorkflowId] = useState<string | null>(
    null
  );
  const [launchResults, setLaunchResults] = useState<LaunchResult[]>([]);
  const [nowMs, setNowMs] = useState(() => Date.now());

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
  const activeWorkflow = useMemo(
    () =>
      activeSession
        ? workflows.find((workflow) => workflow.id === activeSession.workflowId) ??
          null
        : null,
    [activeSession, workflows]
  );
  const activeElapsedSeconds = getElapsedSeconds(activeSession, nowMs);
  const isSelectedWorkflowRunning =
    Boolean(selectedWorkflow) &&
    activeSession?.workflowId === selectedWorkflow?.id;
  const isAnotherWorkflowRunning =
    Boolean(activeSession) && !isSelectedWorkflowRunning;
  const isSelectedWorkflowLaunching =
    Boolean(selectedWorkflow) &&
    launchingWorkflowId === selectedWorkflow?.id;

  useEffect(() => {
    if (!activeSession) {
      return undefined;
    }

    setNowMs(Date.now());

    const intervalId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeSession]);

  const handleAddLaunchItem = async (input: CreateLaunchItemInput) => {
    if (!selectedWorkflow) {
      setError('Select a workflow before adding a launch item.');
      return null;
    }

    try {
      const updatedWorkflow = await window.nodeStart.addLaunchItem(
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
      await window.nodeStart.launchLaunchItem(
        selectedWorkflow.id,
        launchItem.id
      );
      setError('');
    } catch (requestError) {
      setError(getErrorMessage(requestError) || 'Unable to open launch item.');
    }
  };

  const handleSetLaunchItemEnabled = async (
    launchItem: LaunchItem,
    enabled: boolean
  ) => {
    if (!selectedWorkflow) {
      setError('Select a workflow before updating an item.');
      return;
    }

    try {
      const updatedWorkflow = await window.nodeStart.setLaunchItemEnabled(
        selectedWorkflow.id,
        launchItem.id,
        enabled
      );

      replaceWorkflow(updatedWorkflow);
      setError('');
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) || 'Failed to update launch item.'
      );
    }
  };

  const handleStartStudy = async () => {
    if (!selectedWorkflow) {
      setError('Select a workflow before starting study.');
      return;
    }

    if (launchingWorkflowId) {
      setError('Wait for the current launch to finish.');
      return;
    }

    if (activeSession) {
      if (activeSession.workflowId === selectedWorkflow.id) {
        try {
          const appData = await window.nodeStart.stopActiveSession(
            selectedWorkflow.id
          );

          applyAppData(appData);
          setError('');
        } catch (requestError) {
          setError(
            getErrorMessage(requestError) || 'Failed to stop study session.'
          );
        }

        return;
      }

      setError(
        activeWorkflow
          ? `Stop "${activeWorkflow.name}" before starting another workflow.`
          : 'Stop the active workflow before starting another one.'
      );
      return;
    }

    if (enabledLaunchItems.length === 0) {
      setLaunchResults([]);
      setError('No enabled launch items.');
      return;
    }

    setLaunchingWorkflowId(selectedWorkflow.id);
    setLaunchResults([]);

    try {
      const launchResult = await window.nodeStart.launchWorkflow(
        selectedWorkflow.id
      );

      setLaunchResults(sortLaunchResultsByOrder(launchResult.launchResults));
      setActiveSession(launchResult.activeSession ?? null);
      setError(launchResult.message ?? '');
    } catch (requestError) {
      setError(getErrorMessage(requestError) || 'Failed to start study.');
      setActiveSession(null);
      setLaunchResults([]);
    } finally {
      setLaunchingWorkflowId(null);
    }
  };

  const handleStopStudy = async () => {
    if (!selectedWorkflow) {
      setError('Select a workflow before stopping study.');
      return;
    }

    if (!isSelectedWorkflowRunning) {
      setError('');
      return;
    }

    try {
      const appData = await window.nodeStart.stopActiveSession(
        selectedWorkflow.id
      );

      applyAppData(appData);
      setError('');
    } catch (requestError) {
      setError(getErrorMessage(requestError) || 'Failed to stop study.');
    }
  };

  const handleReorderLaunchItems = async (orderedLaunchItemIds: string[]) => {
    if (!selectedWorkflow) {
      setError('Select a workflow before reordering items.');
      return;
    }

    try {
      const updatedWorkflow = await window.nodeStart.reorderLaunchItems(
        selectedWorkflow.id,
        orderedLaunchItemIds
      );

      replaceWorkflow(updatedWorkflow);
      setError('');
    } catch (requestError) {
      setError(
        getErrorMessage(requestError) || 'Failed to reorder launch items.'
      );
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
      const updatedWorkflow = await window.nodeStart.deleteLaunchItem(
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
          activeWorkflowId={activeSession?.workflowId ?? null}
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
          activeSession={activeSession}
          activeWorkflowName={activeWorkflow?.name ?? null}
          currentElapsedSeconds={activeElapsedSeconds}
          enabledLaunchItemCount={enabledLaunchItems.length}
          isAnotherWorkflowRunning={isAnotherWorkflowRunning}
          isLaunching={isSelectedWorkflowLaunching}
          isRunning={isSelectedWorkflowRunning}
          launchResults={launchResults}
          launchItems={launchItems}
          onAddLaunchItem={handleAddLaunchItem}
          onDeleteLaunchItem={handleDeleteLaunchItem}
          onDeleteWorkflow={deleteWorkflow}
          onAddTask={addTask}
          onDeleteTask={deleteTask}
          onError={setError}
          onLaunchItem={handleLaunchItem}
          onReorderLaunchItems={handleReorderLaunchItems}
          onSetLaunchItemEnabled={handleSetLaunchItemEnabled}
          onStartStudy={handleStartStudy}
          onStopStudy={handleStopStudy}
          onSetTaskCompleted={setTaskCompleted}
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
