# nodeStart

nodeStart is a Windows-first local study workflow launcher built with Electron and TypeScript.

The app keeps workflow data on this device. It does not require an account and does not provide cloud sync.

## Current Notes

- Launch items can point to URLs, files, folders, or applications.
- Start opens enabled launch items in their saved order.
- Import and Export controls are present but disabled in the current build.
- Local paths are opened through the desktop app process. Review paths before adding them.

## Release Notes

### nodeStart v0.1.0

- Local workflow storage.
- URL, file, folder, and application launch items.
- Drag sorting for launch item order.
- Sequential launch with a temporary failure summary.
