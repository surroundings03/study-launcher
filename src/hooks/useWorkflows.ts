import { useEffect, useMemo, useState } from 'react';
import type {
  ActiveSession,
  AppData,
  CreateWorkflowInput,
  UpdateWorkflowInput,
  Workflow
} from '../shared/types';

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export const useWorkflows = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(
    null
  );
  const [activeSession, setActiveSession] = useState<ActiveSession>(null);
  const [error, setError] = useState('');

  const selectedWorkflow = useMemo(
    () =>
      workflows.find((workflow) => workflow.id === selectedWorkflowId) ?? null,
    [selectedWorkflowId, workflows]
  );

  const applyAppData = (appData: AppData) => {
    setWorkflows(appData.workflows);
    setActiveSession(appData.activeSession);
    setSelectedWorkflowId((currentWorkflowId) => {
      if (
        currentWorkflowId &&
        appData.workflows.some((workflow) => workflow.id === currentWorkflowId)
      ) {
        return currentWorkflowId;
      }

      return appData.workflows[0]?.id ?? null;
    });
  };

  useEffect(() => {
    window.nodeStart
      .getAppData()
      .then((storedAppData) => {
        applyAppData(storedAppData);
      })
      .catch((requestError) => {
        setError(getErrorMessage(requestError) || 'Failed to load workflows.');
      });
  }, []);

  const selectWorkflow = (workflowId: string) => {
    setSelectedWorkflowId(workflowId);
    setError('');
  };

  const createWorkflow = async (
    input: CreateWorkflowInput
  ): Promise<Workflow | null> => {
    try {
      const workflow = await window.nodeStart.createWorkflow(input);

      setWorkflows((currentWorkflows) => [...currentWorkflows, workflow]);
      setSelectedWorkflowId(workflow.id);
      setError('');

      return workflow;
    } catch (requestError) {
      setError(getErrorMessage(requestError) || 'Failed to create workflow.');
      return null;
    }
  };

  const updateWorkflow = async (
    workflowId: string,
    input: UpdateWorkflowInput
  ): Promise<Workflow | null> => {
    try {
      const updatedWorkflow = await window.nodeStart.updateWorkflow(
        workflowId,
        input
      );

      setWorkflows((currentWorkflows) =>
        currentWorkflows.map((workflow) =>
          workflow.id === updatedWorkflow.id ? updatedWorkflow : workflow
        )
      );
      setError('');

      return updatedWorkflow;
    } catch (requestError) {
      setError(getErrorMessage(requestError) || 'Failed to update workflow.');
      return null;
    }
  };

  const deleteWorkflow = async (workflowToDelete: Workflow) => {
    const shouldDelete = window.confirm(
      `Delete workflow "${workflowToDelete.name}"?`
    );

    if (!shouldDelete) {
      return;
    }

    try {
      const nextWorkflows = await window.nodeStart.deleteWorkflow(
        workflowToDelete.id
      );
      const appData = await window.nodeStart.getAppData();

      applyAppData({
        ...appData,
        workflows: nextWorkflows
      });

      if (workflowToDelete.id === selectedWorkflowId) {
        setSelectedWorkflowId(nextWorkflows[0]?.id ?? null);
      }

      setError('');
    } catch (requestError) {
      setError(getErrorMessage(requestError) || 'Failed to delete workflow.');
    }
  };

  const replaceWorkflow = (updatedWorkflow: Workflow) => {
    setWorkflows((currentWorkflows) =>
      currentWorkflows.map((workflow) =>
        workflow.id === updatedWorkflow.id ? updatedWorkflow : workflow
      )
    );
  };

  return {
    activeSession,
    applyAppData,
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
    setActiveSession
  };
};
