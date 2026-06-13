import { useMemo, useState } from 'react';
import type {
  ActiveSession,
  CreateLaunchItemInput,
  LaunchItem,
  LaunchResult,
  UpdateWorkflowInput,
  Workflow
} from '../shared/types';
import { LaunchButton } from './LaunchButton';
import { LaunchItemEditor } from './LaunchItemEditor';
import { LaunchItemList } from './LaunchItemList';
import { LaunchResultSummary } from './LaunchResultSummary';
import { RecentCompletions } from './RecentCompletions';
import { TaskList } from './TaskList';
import { TimeStats } from './TimeStats';
import { WorkflowEditor } from './WorkflowEditor';

type WorkflowDetailProps = {
  workflow: Workflow;
  activeSession: ActiveSession;
  activeWorkflowName: string | null;
  currentElapsedSeconds: number;
  enabledLaunchItemCount: number;
  isAnotherWorkflowRunning: boolean;
  isLaunching: boolean;
  isRunning: boolean;
  launchResults: LaunchResult[];
  launchItems: LaunchItem[];
  onAddLaunchItem(
    input: CreateLaunchItemInput
  ): Promise<Workflow | null>;
  onDeleteLaunchItem(launchItem: LaunchItem): void;
  onDeleteWorkflow(workflow: Workflow): void;
  onError(message: string): void;
  onLaunchItem(launchItem: LaunchItem): void;
  onReorderLaunchItems(orderedLaunchItemIds: string[]): void;
  onStartStudy(): void;
  onStopStudy(): void;
  onUpdateWorkflow(
    workflowId: string,
    input: UpdateWorkflowInput
  ): Promise<Workflow | null>;
};

export function WorkflowDetail({
  workflow,
  activeSession,
  activeWorkflowName,
  currentElapsedSeconds,
  enabledLaunchItemCount,
  isAnotherWorkflowRunning,
  isLaunching,
  isRunning,
  launchResults,
  launchItems,
  onAddLaunchItem,
  onDeleteLaunchItem,
  onDeleteWorkflow,
  onError,
  onLaunchItem,
  onReorderLaunchItems,
  onStartStudy,
  onStopStudy,
  onUpdateWorkflow
}: WorkflowDetailProps) {
  const [isAddItemFormOpen, setIsAddItemFormOpen] = useState(false);
  const [isEditingWorkflow, setIsEditingWorkflow] = useState(false);
  const isStartDisabled = useMemo(
    () => isLaunching,
    [isLaunching]
  );

  return (
    <>
      <section className="workflow-hero">
        <div className="hero-copy">
          {isEditingWorkflow ? (
            <WorkflowEditor
              workflow={workflow}
              onCancel={() => setIsEditingWorkflow(false)}
              onSave={(input) => onUpdateWorkflow(workflow.id, input)}
            />
          ) : (
            <>
              <div className="hero-title-row">
                <h1>{workflow.name}</h1>
                <button
                  className="icon-text-button"
                  type="button"
                  onClick={() => setIsEditingWorkflow(true)}
                >
                  Edit
                </button>
                <button
                  className="icon-text-button danger"
                  type="button"
                  onClick={() => onDeleteWorkflow(workflow)}
                >
                  Delete
                </button>
              </div>
              <div className="hero-meta">
                <span>{launchItems.length} launch items</span>
                <span>{enabledLaunchItemCount} enabled</span>
              </div>
            </>
          )}
        </div>

        <LaunchButton
          disabled={isStartDisabled}
          enabledLaunchItemCount={enabledLaunchItemCount}
          isAnotherWorkflowRunning={isAnotherWorkflowRunning}
          isLaunching={isLaunching}
          isRunning={isRunning}
          timerSeconds={currentElapsedSeconds}
          onStart={isRunning ? onStopStudy : onStartStudy}
        />
      </section>

      <div className="dashboard-grid">
        <section className="panel launch-panel">
          <div className="panel-header">
            <div>
              <h2>Launch Items</h2>
              <p>Start opens enabled launch items in this order.</p>
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
            <LaunchItemEditor
              onAddLaunchItem={onAddLaunchItem}
              onCancel={() => setIsAddItemFormOpen(false)}
              onError={onError}
            />
          )}

          <LaunchItemList
            launchItems={launchItems}
            onDeleteLaunchItem={onDeleteLaunchItem}
            onLaunchItem={onLaunchItem}
            onReorderLaunchItems={onReorderLaunchItems}
          />

          <LaunchResultSummary launchResults={launchResults} />
        </section>

        <TimeStats
          activeSession={activeSession}
          activeWorkflowName={activeWorkflowName}
          currentElapsedSeconds={currentElapsedSeconds}
          isWorkflowRunning={isRunning}
          workflow={workflow}
        />
        <TaskList />
        <RecentCompletions />
      </div>
    </>
  );
}
