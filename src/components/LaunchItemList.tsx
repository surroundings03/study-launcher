import type { LaunchItem, MoveLaunchItemDirection } from '../shared/types';

type LaunchItemListProps = {
  launchItems: LaunchItem[];
  onDeleteLaunchItem(launchItem: LaunchItem): void;
  onLaunchItem(launchItem: LaunchItem): void;
  onMoveLaunchItem(
    launchItem: LaunchItem,
    direction: MoveLaunchItemDirection
  ): void;
};

const formatOrder = (index: number): string => `[${index + 1}]`;

export function LaunchItemList({
  launchItems,
  onDeleteLaunchItem,
  onLaunchItem,
  onMoveLaunchItem
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
      {launchItems.map((launchItem, index) => (
        <article
          className={launchItem.enabled ? 'launch-row' : 'launch-row disabled'}
          key={launchItem.id}
        >
          <span className="order-badge" aria-label="Launch order">
            {formatOrder(index)}
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
            <div className="order-actions" aria-label="Launch item order">
              <button
                className="order-button"
                type="button"
                disabled={index === 0}
                onClick={() => onMoveLaunchItem(launchItem, 'up')}
                title="Move up"
                aria-label={`Move ${launchItem.title} up`}
              >
                ↑
              </button>
              <button
                className="order-button"
                type="button"
                disabled={index === launchItems.length - 1}
                onClick={() => onMoveLaunchItem(launchItem, 'down')}
                title="Move down"
                aria-label={`Move ${launchItem.title} down`}
              >
                ↓
              </button>
            </div>
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
