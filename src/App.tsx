import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type { Workflow } from './shared/types';

export default function App() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(
    null
  );
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const selectedWorkflow = useMemo(
    () =>
      workflows.find((workflow) => workflow.id === selectedWorkflowId) ?? null,
    [selectedWorkflowId, workflows]
  );

  useEffect(() => {
    window.studyLauncher
      .getWorkflows()
      .then((storedWorkflows) => {
        setWorkflows(storedWorkflows);
        setSelectedWorkflowId(storedWorkflows[0]?.id ?? null);
      })
      .catch((requestError) => {
        setError(requestError.message ?? '读取工作流失败');
      });
  }, []);

  const handleCreateWorkflow = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('工作流名称不能为空');
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
    } catch (requestError) {
      setError((requestError as Error).message ?? '创建工作流失败');
    }
  };

  const handleDeleteWorkflow = async () => {
    if (!selectedWorkflow) {
      return;
    }

    const shouldDelete = window.confirm(
      `确定删除工作流“${selectedWorkflow.name}”吗？`
    );

    if (!shouldDelete) {
      return;
    }

    try {
      const nextWorkflows = await window.studyLauncher.deleteWorkflow(
        selectedWorkflow.id
      );

      setWorkflows(nextWorkflows);
      setSelectedWorkflowId(nextWorkflows[0]?.id ?? null);
      setError('');
    } catch (requestError) {
      setError((requestError as Error).message ?? '删除工作流失败');
    }
  };

  return (
    <main className="app-shell">
      <section className="sidebar">
        <h1>Study Launcher</h1>
        <form className="workflow-form" onSubmit={handleCreateWorkflow}>
          <label>
            名称
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="例如：高数复习"
            />
          </label>
          <label>
            描述
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="可选"
              rows={3}
            />
          </label>
          <button type="submit">创建工作流</button>
        </form>

        {error && <p className="error-message">{error}</p>}

        <div className="workflow-list">
          {workflows.map((workflow) => (
            <button
              className={
                workflow.id === selectedWorkflowId
                  ? 'workflow-item selected'
                  : 'workflow-item'
              }
              key={workflow.id}
              type="button"
              onClick={() => setSelectedWorkflowId(workflow.id)}
            >
              {workflow.name}
            </button>
          ))}
        </div>
      </section>

      <section className="workflow-detail">
        {selectedWorkflow ? (
          <>
            <div>
              <h2>{selectedWorkflow.name}</h2>
              <p>{selectedWorkflow.description || '暂无描述'}</p>
            </div>
            <button type="button" onClick={handleDeleteWorkflow}>
              删除当前工作流
            </button>
          </>
        ) : (
          <p>暂无工作流，请先创建一个</p>
        )}
      </section>
    </main>
  );
}
