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
            NS
          </span>
          <span className="brand-name">nodeStart</span>
        </div>
        <div className="window-controls" aria-label="Window controls">
          <button
            className="window-control"
            type="button"
            title="Minimize"
            aria-label="Minimize window"
            onClick={() => window.windowControls.minimize()}
          >
            <span className="window-glyph minimize" aria-hidden="true" />
          </button>
          <button
            className="window-control"
            type="button"
            title="Maximize or restore"
            aria-label="Maximize or restore window"
            onClick={() => window.windowControls.toggleMaximize()}
          >
            <span className="window-glyph maximize" aria-hidden="true" />
          </button>
          <button
            className="window-control close"
            type="button"
            title="Close"
            aria-label="Close window"
            onClick={() => window.windowControls.close()}
          >
            <span className="window-glyph close" aria-hidden="true" />
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
