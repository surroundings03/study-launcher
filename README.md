# nodeStart

## Overview / 项目简介

nodeStart is a Windows-first local study workflow launcher built with Electron,
TypeScript, and React. It helps you configure web pages, files, folders, and
desktop applications for different study scenarios, then open enabled resources
in order while tracking study time and task completion.

nodeStart 是一个 Windows 优先的本地学习工作流启动器，使用 Electron、
TypeScript 和 React 构建。它可以为不同学习场景配置网页、文件、文件夹和桌面应用，
并按顺序打开已启用的资源，同时记录学习时长和任务完成情况。

Typical use cases include math review, programming labs, English writing,
paper reading, course preparation, and any workflow where the same resources
need to be opened repeatedly.

适用场景包括高数复习、编程实验、英语写作、资料阅读、课程准备，以及任何需要反复打开同一组资源的学习流程。

Current status: first usable version, v0.1.0 in development.

当前状态：第一个可用版本，v0.1.0 开发中。

## Features / 功能

- Create, edit, select, and delete workflows.
- Add launch items for URLs, files, folders, and Windows applications.
- Enable or disable individual launch items.
- Drag launch items to adjust their order.
- Start enabled launch items in the order shown in the list.
- Continue launching later items even if one item fails.
- Show a launch result summary after starting a workflow.
- Track one active study session at a time.
- Show today's study time and total study time.
- Manage a simple task list for the selected workflow.
- Show recent task completions.
- Save workflow data locally on the current device.

- 创建、编辑、选择和删除工作流。
- 添加 URL、文件、文件夹和 Windows 应用程序启动项。
- 启用或禁用单个启动项。
- 通过拖拽调整启动项顺序。
- 按列表显示顺序打开已启用的启动项。
- 某个启动项失败时，后续启动项仍会继续打开。
- Start 后显示启动结果汇总。
- 同一时间只记录一个 active study session。
- 显示今日学习时长和总学习时长。
- 为当前工作流管理简单任务列表。
- 显示最近完成记录。
- 工作流数据只保存在当前设备本地。

## Tech Stack / 技术栈

- Electron
- Electron Forge
- TypeScript
- React
- Vite
- electron-store

## Getting Started / 本地运行

Install dependencies:

安装依赖：

```bash
npm install
```

Start the desktop app in development mode:

以开发模式启动桌面应用：

```bash
npm start
```

Run the TypeScript check:

运行 TypeScript 检查：

```bash
npx tsc --noEmit
```

## Build / 打包

Create distributable packages with Electron Forge:

使用 Electron Forge 生成分发产物：

```bash
npm run make
```

Build output is generated in the `out/` directory. The exact package formats
depend on the makers configured in `forge.config.ts`.

打包产物会生成在 `out/` 目录中，具体格式取决于 `forge.config.ts` 中配置的 maker。

## Usage / 使用流程

1. Create a workflow, such as `Math Review`.
2. Add launch items, such as ChatGPT, a PDF handout, a course folder, or VS Code.
3. Drag launch items into the order you want.
4. Disable any item that should not open this time.
5. Click `Start`.
6. nodeStart opens enabled launch items in the displayed order.
7. Click `Stop` when the study session is over.
8. The session duration is saved to the current workflow.

1. 创建一个工作流，例如“高数复习”。
2. 添加启动项，例如 ChatGPT、课件 PDF、课程文件夹或 VS Code。
3. 将启动项拖拽到需要的顺序。
4. 禁用本次不需要打开的启动项。
5. 点击 `Start`。
6. nodeStart 会按显示顺序打开已启用的启动项。
7. 学习结束后点击 `Stop`。
8. 本次学习时长会保存到当前工作流。

Important behavior:

重要行为：

- Launch items are opened in the same order shown in the list.
- Disabled launch items are skipped.
- If one launch item fails, later enabled launch items still continue.
- Only one workflow can have an active study session at a time.

- 启动项会按列表中的显示顺序依次打开。
- disabled 的启动项不会被打开。
- 某个启动项失败时，不会阻止后面的 enabled 启动项继续打开。
- 同一时间只能有一个工作流处于学习计时状态。

## Data Storage / 数据保存

nodeStart currently uses local storage only. Workflows, launch items, tasks, and
study records are saved on the current computer. Data is not uploaded to the
cloud, and there is no account system or multi-device sync.

nodeStart 当前版本只使用本地存储。工作流、启动项、任务和学习记录只保存在当前电脑中，
不会上传到云端，也没有账号系统或多设备同步。

Local files, folders, and applications are stored as local paths. If a file,
folder, or application is moved, deleted, or renamed, the saved launch item path
may stop working and should be selected again.

文件、文件夹和应用程序会以本地路径形式保存。如果文件、文件夹或应用程序被移动、删除或重命名，
原启动项路径可能失效，需要重新选择。

## Security and Privacy / 安全与隐私

- nodeStart does not collect user data.
- nodeStart does not upload workflow data.
- There is no account login or cloud sync.
- Opening local files, folders, and applications is handled by the Electron main process.
- The renderer does not directly access Node.js system APIs such as `fs`, `path`, or `shell`.

- nodeStart 不收集用户数据。
- nodeStart 不上传工作流数据。
- 当前版本没有账号登录或云同步。
- 打开本地文件、文件夹和应用程序由 Electron main process 执行。
- renderer 不直接访问 `fs`、`path`、`shell` 等 Node.js 系统能力。

## Limitations / 当前限制

Current versions do not support:

当前版本暂不支持：

- Account system.
- Cloud sync.
- Multi-device sync.
- Mobile app.
- Complex analytics charts.
- Pomodoro timer.
- Import/export.

- 账号系统。
- 云同步。
- 多设备同步。
- 移动端。
- 复杂统计图表。
- 番茄钟。
- 导入导出。

## FAQ / 常见问题

### Why does a file fail to open?

The file may have been moved, deleted, renamed, or made inaccessible. Select the
file again and update the launch item.

### 为什么文件打不开？

文件可能已被移动、删除、重命名，或当前无法访问。请重新选择文件并更新启动项。

### Why was a launch item not opened?

The item may be disabled, or its path or URL may be invalid.

### 为什么启动项没有被打开？

该启动项可能被 disabled，或者路径 / URL 无效。

### Does data sync to the cloud?

No. Current versions save data only on the current device.

### 数据会同步到云端吗？

不会。当前版本只保存在本机。

### Can I use it on macOS?

The current version is Windows-first. macOS is not a primary tested target.

### 可以在 macOS 上使用吗？

当前版本 Windows 优先，macOS 不是重点测试目标。

### Why does Windows show a security warning during installation?

Current Windows builds are not code signed. Windows SmartScreen may show a
warning during first install or first launch. This does not automatically mean
the app is unsafe, but users should only run installers from a trusted source.

### 为什么安装时 Windows 有安全提示？

当前版本的 Windows 安装包未进行代码签名。首次安装或首次运行时，Windows SmartScreen
可能显示安全提醒。这不代表程序一定有问题，但用户应确认安装包来源可信后再运行。

## Release Notes / 版本说明

### nodeStart v0.1.0

- Local workflow storage.
- URL, file, folder, and application launch items.
- Enable and disable launch items.
- Drag sorting for launch item order.
- Sequential launch with failure summary.
- Single active study session timer.
- Today and total study time.
- Simple tasks and recent completions.
- Frameless desktop window with custom controls.

- 本地工作流存储。
- URL、文件、文件夹和应用程序启动项。
- 启用和禁用启动项。
- 拖拽调整启动项顺序。
- 按顺序启动并显示失败汇总。
- 单一 active study session 计时。
- 今日学习时长和总学习时长。
- 简单任务和最近完成记录。
- 无系统标题栏桌面窗口和自定义窗口控制。
