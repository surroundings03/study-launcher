import { useMemo, useState } from 'react';
import type {
  CreateUrlLaunchItemInput,
  LaunchItem,
  UpdateWorkflowInput,
  Workflow
} from '../shared/types';
import { LaunchButton } from './LaunchButton';
import { LaunchItemEditor } from './LaunchItemEditor';
import { LaunchItemList } from './LaunchItemList';
import { RecentCompletions } from './RecentCompletions';
import { TaskList } from './TaskList';
import { TimeStats } from './TimeStats';
import { WorkflowEditor } from './WorkflowEditor';

type WorkflowDetailProps = {
  workflow: Workflow;
  enabledLaunchItemCount: number;
  isStarting: boolean;
  launchItems: LaunchItem[];
  onAddUrlLaunchItem(
    input: CreateUrlLaunchItemInput
  ): Promise<Workflow | null>;
  onDeleteLaunchItem(launchItem: LaunchItem): void;
  onDeleteWorkflow(workflow: Workflow): void;
  onError(message: string): void;
  onLaunchUrlLaunchItem(launchItem: LaunchItem): void;
  onStartStudy(): void;
  onUpdateWorkflow(
    workflowId: string,
    input: UpdateWorkflowInput
  ): Promise<Workflow | null>;
};

export function WorkflowDetail({
  workflow,
  enabledLaunchItemCount,
  isStarting,
  launchItems,
  onAddUrlLaunchItem,
  onDeleteLaunchItem,
  onDeleteWorkflow,
  onError,
  onLaunchUrlLaunchItem,
  onStartStudy,
  onUpdateWorkflow
}: WorkflowDetailProps) {
  const [isAddItemFormOpen, setIsAddItemFormOpen] = useState(false);
  const [isEditingWorkflow, setIsEditingWorkflow] = useState(false);
  const isStartDisabled = useMemo(
    () => enabledLaunchItemCount === 0 || isStarting,
    [enabledLaunchItemCount, isStarting]
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
                <span>{launchItems.length} URL launch items</span>
                <span>{enabledLaunchItemCount} enabled</span>
              </div>
            </>
          )}
        </div>

        <LaunchButton
          disabled={isStartDisabled}
          isStarting={isStarting}
          onStart={onStartStudy}
        />
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
            <LaunchItemEditor
              onAddUrlLaunchItem={onAddUrlLaunchItem}
              onCancel={() => setIsAddItemFormOpen(false)}
              onError={onError}
            />
          )}

          <LaunchItemList
            launchItems={launchItems}
            onDeleteLaunchItem={onDeleteLaunchItem}
            onLaunchUrlLaunchItem={onLaunchUrlLaunchItem}
          />
        </section>

        <TimeStats />
        <TaskList />
        <RecentCompletions />
      </div>
    </>
  );
}
