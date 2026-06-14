# Study Launcher

Study Launcher is a Windows-first desktop app for starting a local study
workflow. Create a workflow, add the URLs, files, folders, and Windows apps you
usually need, arrange them in order, then open the enabled items with one
button.

The app is built with Electron, TypeScript, React, Vite, Electron Forge, and
electron-store.

## Features

- Dark study workspace UI
- Workflow creation, editing, selection, and deletion
- URL, file, folder, and Windows application launch items
- Per-item enable and disable toggle
- Visible launch item ordering
- Drag-and-drop launch item sorting
- Ordered launch execution
- Failure summary for launch items that could not be opened
- Single active study timer
- Today and total study time
- Simple task list
- Recent completed tasks
- Local data storage

## Install

Download the Windows installer from the GitHub Releases page and run it.

The Windows installer is currently unsigned. Windows SmartScreen or antivirus
software may show a warning during installation or first launch. Only run
installers downloaded from a release source you trust.

## Local Development

Install dependencies:

```bash
npm install
```

Run the app in development mode:

```bash
npm start
```

Run the TypeScript check:

```bash
npx tsc --noEmit
```

## Packaging

Create distributable packages with Electron Forge:

```bash
npm run make
```

Build output is generated in `out/`. Do not commit `out/` or generated
installer files to the repository.

## Usage

1. Create a workflow, for example `Exam Review`.
2. Add launch items such as:
   - `https://example.com/course`
   - `C:\Path\To\File.pdf`
   - `D:\Study\Course\Chapter1`
   - `C:\Path\To\App.exe`
3. Drag launch items into the order you want.
4. Disable items that should not open this time.
5. Click `Start`.
6. Enabled launch items open in the list order, from top to bottom.
7. If one item fails, later enabled items still continue.
8. Click `Stop` when the session is over.

If every launch item fails to open, the timer does not start. If at least one
launch item opens successfully, the timer starts.

## Data Storage and Privacy

Study Launcher stores data only on the current computer.

- Data is saved locally with `electron-store`.
- Data is not uploaded to the cloud.
- There is no account system.
- There is no backend service.
- There is no cloud sync.
- Workflows, launch items, tasks, and session history stay on the device where
  they were created.

Local file, folder, and application launch items store local paths. If a file,
folder, or app is moved, renamed, deleted, or becomes inaccessible, the saved
path stops working and the launch item must be updated manually.

## Import and Export

Study Launcher v0.1.0 does not include in-app import or export controls.

If you manually share, back up, or import JSON data in the future, check all
paths and links before using it. A JSON file from another person may contain
paths that do not exist on your computer, private local paths, or links you do
not want to open.

## FAQ

### Why did a file, folder, or app fail to open?

The saved path may no longer exist, or the item may be inaccessible. Update the
launch item with the current path.

### Why did a URL fail to open?

Only `http` and `https` URLs are supported. Check that the link is valid.

### Why did one disabled item not open?

Disabled launch items are skipped when you click `Start`. You can still open an
item manually with its `Open` button.

### Does Study Launcher upload my data?

No. Data stays on your local computer. The app has no account system, cloud
sync, or backend service.

### Can I use the same data on another computer?

There is no built-in sync in v0.1.0. If data is moved manually in the future,
check all paths and links before opening them on another computer.

### Why does Windows show a security warning?

The v0.1.0 Windows installer is unsigned. Windows may show a security warning
for unsigned apps. This does not automatically mean the app is unsafe, but users
should only run installers from a trusted release source.

## License

Study Launcher is released under the MIT License. See [LICENSE](LICENSE).
