import type { ReactNode } from 'react';

type AppShellProps = {
  sidebar: ReactNode;
  children: ReactNode;
};

export function AppShell({ sidebar, children }: AppShellProps) {
  return (
    <div className="app-root">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            SL
          </span>
          <span className="brand-name">Study Launcher</span>
        </div>
        <div className="topbar-actions" aria-label="Application tools">
          <button className="toolbar-button" type="button" disabled>
            Import
          </button>
          <button className="toolbar-button" type="button" disabled>
            Export
          </button>
          <button className="toolbar-button" type="button" disabled>
            Settings
          </button>
        </div>
      </header>

      <main className="workspace">
        {sidebar}
        <section className="content">{children}</section>
      </main>
    </div>
  );
}
