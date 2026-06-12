import type { LaunchItem } from '../shared/types';

type LaunchItemListProps = {
  launchItems: LaunchItem[];
  onDeleteLaunchItem(launchItem: LaunchItem): void;
  onLaunchItem(launchItem: LaunchItem): void;
};

const formatOrder = (order: number): string =>
  Number.isFinite(order) ? `[${order}]` : '[--]';

export function LaunchItemList({
  launchItems,
  onDeleteLaunchItem,
  onLaunchItem
}: LaunchItemListProps) {
  if (launchItems.length === 0) {
    return (
      <div className="empty-state">
        <strong>No launch items yet</strong>
        <span>Add a URL item to define the study start order.</span>
      </div>
    );
  }

  return (
    <div className="launch-list">
      {launchItems.map((launchItem) => (
        <article
          className={launchItem.enabled ? 'launch-row' : 'launch-row disabled'}
          key={launchItem.id}
        >
          <span className="order-badge" aria-label="Launch order">
            {formatOrder(launchItem.order)}
          </span>
          <div className="launch-main">
            <div className="launch-title-line">
              <strong>{launchItem.title}</strong>
              <span className={`type-badge ${launchItem.type}`}>
                {launchItem.type.toUpperCase()}
              </span>
            </div>
            <span className="launch-target" title={launchItem.target}>
              {launchItem.target}
            </span>
          </div>
          <div className="launch-actions">
            <span
              className={
                launchItem.enabled ? 'toggle-indicator on' : 'toggle-indicator'
              }
              role="switch"
              aria-checked={launchItem.enabled}
              aria-disabled="true"
              title="Enable state is read-only in this phase."
            >
              <span aria-hidden="true" />
            </span>
            <button
              className="secondary-button"
              type="button"
              disabled={!launchItem.enabled}
              onClick={() => onLaunchItem(launchItem)}
            >
              Open
            </button>
            <button
              className="row-action danger"
              type="button"
              onClick={() => onDeleteLaunchItem(launchItem)}
            >
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
