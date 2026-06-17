# Study Launcher / 学习启动器

Study Launcher 是一个 Windows 优先的桌面应用，用于启动本地学习工作流。你可以创建一个工作流，添加平时学习需要用到的 URLs、文件、文件夹和 Windows 应用程序，调整它们的顺序，然后通过一个按钮打开所有已启用的启动项。

Study Launcher is a Windows-first desktop app for starting a local study workflow. Create a workflow, add the URLs, files, folders, and Windows apps you usually need, arrange them in order, then open the enabled items with one button.

本应用使用 Electron、TypeScript、React、Vite、Electron Forge 和 electron-store 构建。

The app is built with Electron, TypeScript, React, Vite, Electron Forge, and electron-store.

## Features / 功能

* 深色学习工作区界面
  Dark study workspace UI

* 工作流创建、编辑、选择和删除
  Workflow creation, editing, selection, and deletion

* URL、文件、文件夹和 Windows 应用程序启动项
  URL, file, folder, and Windows application launch items

* 单个启动项启用 / 禁用开关
  Per-item enable and disable toggle

* 可见的启动项顺序
  Visible launch item ordering

* 拖拽排序启动项
  Drag-and-drop launch item sorting

* 按顺序执行启动
  Ordered launch execution

* 启动失败项汇总
  Failure summary for launch items that could not be opened

* 单一活动学习计时器
  Single active study timer

* 今日学习时长和总学习时长
  Today and total study time

* 简单任务列表
  Simple task list

* 最近完成任务记录
  Recent completed tasks

* 本地数据存储
  Local data storage

## Install / 安装

从 GitHub Releases 页面下载 Windows 安装包并运行。

Download the Windows installer from the GitHub Releases page and run it.

当前 Windows 安装包未签名。Windows SmartScreen 或杀毒软件可能会在安装或首次启动时显示警告。请只运行来自可信 Release 来源的安装包。

The Windows installer is currently unsigned. Windows SmartScreen or antivirus software may show a warning during installation or first launch. Only run installers downloaded from a release source you trust.

## Local Development / 本地开发

安装依赖：

Install dependencies:

```bash
npm install
```

以开发模式运行应用：

Run the app in development mode:

```bash
npm start
```

运行 TypeScript 检查：

Run the TypeScript check:

```bash
npx tsc --noEmit
```

## Usage / 使用方法

1. 创建一个工作流，例如 `Exam Review`。
   Create a workflow, for example `Exam Review`.

2. 添加启动项，例如：
   Add launch items such as:

   * `https://example.com/course`
   * `C:\Path\To\File.pdf`
   * `D:\Study\Course\Chapter1`
   * `C:\Path\To\App.exe`

3. 将启动项拖拽到你想要的顺序。
   Drag launch items into the order you want.

4. 禁用本次不需要打开的启动项。
   Disable items that should not open this time.

5. 点击 `Start`。
   Click `Start`.

6. 已启用的启动项会按照列表顺序从上到下依次打开。
   Enabled launch items open in the list order, from top to bottom.

7. 如果某个启动项打开失败，后续已启用的启动项仍会继续打开。
   If one item fails, later enabled items still continue.

8. 学习结束后点击 `Stop`。
   Click `Stop` when the session is over.

如果所有启动项都打开失败，计时器不会启动。如果至少一个启动项成功打开，计时器会启动。

If every launch item fails to open, the timer does not start. If at least one launch item opens successfully, the timer starts.

## Data Storage and Privacy / 数据存储与隐私

Study Launcher 只在当前电脑上保存数据。

Study Launcher stores data only on the current computer.

* 数据通过 `electron-store` 保存在本地。
  Data is saved locally with `electron-store`.

* 数据不会上传到云端。
  Data is not uploaded to the cloud.

* 没有账号系统。
  There is no account system.

* 没有后端服务。
  There is no backend service.

* 没有云同步。
  There is no cloud sync.

* 工作流、启动项、任务和学习记录会保留在创建它们的设备上。
  Workflows, launch items, tasks, and session history stay on the device where they were created.

本地文件、文件夹和应用程序启动项会保存本地路径。如果文件、文件夹或应用被移动、重命名、删除，或变得无法访问，已保存的路径将失效，需要手动更新对应启动项。

Local file, folder, and application launch items store local paths. If a file, folder, or app is moved, renamed, deleted, or becomes inaccessible, the saved path stops working and the launch item must be updated manually.

## Import and Export / 导入与导出

Study Launcher v0.1.0 不包含应用内导入或导出控件。

Study Launcher v0.1.0 does not include in-app import or export controls.

如果将来手动共享、备份或导入 JSON 数据，请在使用前检查所有路径和链接。来自他人的 JSON 文件可能包含你电脑上不存在的路径、私人本地路径，或你不想打开的链接。

If you manually share, back up, or import JSON data in the future, check all paths and links before using it. A JSON file from another person may contain paths that do not exist on your computer, private local paths, or links you do not want to open.

## FAQ / 常见问题

### Why did a file, folder, or app fail to open? / 为什么文件、文件夹或应用打开失败？

已保存的路径可能已经不存在，或者该项目当前无法访问。请使用当前路径更新启动项。

The saved path may no longer exist, or the item may be inaccessible. Update the launch item with the current path.

### Why did a URL fail to open? / 为什么 URL 打开失败？

目前只支持 `http` 和 `https` URL。请检查链接是否有效。

Only `http` and `https` URLs are supported. Check that the link is valid.

### Why did one disabled item not open? / 为什么被禁用的启动项没有打开？

点击 `Start` 时，被禁用的启动项会被跳过。你仍然可以使用该启动项的 `Open` 按钮手动打开它。

Disabled launch items are skipped when you click `Start`. You can still open an item manually with its `Open` button.

### Does Study Launcher upload my data? / Study Launcher 会上传我的数据吗？

不会。数据会保留在你的本地电脑上。本应用没有账号系统、云同步或后端服务。

No. Data stays on your local computer. The app has no account system, cloud sync, or backend service.

### Can I use the same data on another computer? / 我可以在另一台电脑上使用同一份数据吗？

v0.1.0 没有内置同步功能。如果将来手动移动数据，请在另一台电脑上打开前检查所有路径和链接。

There is no built-in sync in v0.1.0. If data is moved manually in the future, check all paths and links before opening them on another computer.

### Why does Windows show a security warning? / 为什么 Windows 会显示安全警告？

v0.1.0 的 Windows 安装包未签名。Windows 可能会对未签名应用显示安全警告。这并不自动代表应用不安全，但用户应只运行来自可信 Release 来源的安装包。

The v0.1.0 Windows installer is unsigned. Windows may show a security warning for unsigned apps. This does not automatically mean the app is unsafe, but users should only run installers from a trusted release source.

## License / 许可证

Study Launcher 基于 MIT License 发布。详见 LICENSE。

Study Launcher is released under the MIT License. See LICENSE.
