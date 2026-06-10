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

  useEffect(() => {
    window.studyLauncher
      .getWorkflows()
      .then((storedWorkflows) => {
        setWorkflows(storedWorkflows);
        setSelectedWorkflowId(storedWorkflows[0]?.id ?? null);
      })
      .catch((requestError) => {
        setError(getErrorMessage(requestError) || '读取工作流失败');
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
      setError(getErrorMessage(requestError) || '创建工作流失败');
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
      setError(getErrorMessage(requestError) || '删除工作流失败');
    }
  };

  const handleAddUrlLaunchItem = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!selectedWorkflow) {
      setError('请先选择一个工作流');
      return;
    }

    const trimmedTitle = urlTitle.trim();
    const trimmedTarget = urlTarget.trim();

    if (!trimmedTitle) {
      setError('标题不能为空');
      return;
    }

    if (!trimmedTarget) {
      setError('URL 不能为空');
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
    } catch (requestError) {
      setError(getErrorMessage(requestError) || '添加 URL 启动项失败');
    }
  };

  const handleLaunchUrlLaunchItem = async (launchItem: LaunchItem) => {
    if (!selectedWorkflow) {
      setError('请先选择一个工作流');
      return;
    }

    try {
      await window.studyLauncher.launchUrlLaunchItem(
        selectedWorkflow.id,
        launchItem.id
      );
      setError('');
    } catch (requestError) {
      setError(getErrorMessage(requestError) || '打开 URL 失败');
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
            <form
              className="launch-item-form"
              onSubmit={handleAddUrlLaunchItem}
            >
              <h3>URL 启动项</h3>
              <label>
                标题
                <input
                  value={urlTitle}
                  onChange={(event) => setUrlTitle(event.target.value)}
                  placeholder="例如：ChatGPT"
                />
              </label>
              <label>
                URL
                <input
                  value={urlTarget}
                  onChange={(event) => setUrlTarget(event.target.value)}
                  placeholder="https://chat.openai.com/"
                />
              </label>
              <button type="submit">添加 URL</button>
            </form>
            <div className="launch-item-list">
              <h3>启动项列表</h3>
              {urlLaunchItems.length > 0 ? (
                urlLaunchItems.map((launchItem) => (
                  <div className="launch-item" key={launchItem.id}>
                    <div>
                      <strong>
                        [{launchItem.order}] {launchItem.title}
                      </strong>
                      <span
                        className="launch-item-target"
                        title={launchItem.target}
                      >
                        {launchItem.target}
                      </span>
                      <small>{launchItem.enabled ? '已启用' : '已禁用'}</small>
                    </div>
                    <button
                      type="button"
                      disabled={!launchItem.enabled}
                      onClick={() => handleLaunchUrlLaunchItem(launchItem)}
                    >
                      启动
                    </button>
                  </div>
                ))
              ) : (
                <p>当前工作流暂无 URL 启动项</p>
              )}
            </div>
          </>
        ) : (
          <p>暂无工作流，请先创建一个</p>
        )}
      </section>
    </main>
  );
}
