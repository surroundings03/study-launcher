import { useState, type DragEvent } from 'react';
import type { LaunchItem } from '../shared/types';

type DropPosition = 'before' | 'after';

type LaunchItemListProps = {
  launchItems: LaunchItem[];
  onDeleteLaunchItem(launchItem: LaunchItem): void;
  onLaunchItem(launchItem: LaunchItem): void;
  onReorderLaunchItems(orderedLaunchItemIds: string[]): void;
  onSetLaunchItemEnabled(launchItem: LaunchItem, enabled: boolean): void;
};

const formatOrder = (index: number): string => `[${index + 1}]`;

const getDropPosition = (event: DragEvent<HTMLElement>): DropPosition => {
  const rowBounds = event.currentTarget.getBoundingClientRect();
  const rowMiddle = rowBounds.top + rowBounds.height / 2;

  return event.clientY < rowMiddle ? 'before' : 'after';
};

const getReorderedLaunchItemIds = (
  launchItems: LaunchItem[],
  sourceItemId: string,
  targetItemId: string,
  dropPosition: DropPosition
): string[] | null => {
  if (sourceItemId === targetItemId) {
    return null;
  }

  const orderedLaunchItemIds = launchItems.map((launchItem) => launchItem.id);
  const sourceIndex = orderedLaunchItemIds.indexOf(sourceItemId);
  const targetIndex = orderedLaunchItemIds.indexOf(targetItemId);

  if (sourceIndex === -1 || targetIndex === -1) {
    return null;
  }

  const nextLaunchItemIds = [...orderedLaunchItemIds];
  const [movedItemId] = nextLaunchItemIds.splice(sourceIndex, 1);
  const adjustedTargetIndex =
    sourceIndex < targetIndex ? targetIndex - 1 : targetIndex;
  const insertIndex =
    dropPosition === 'before' ? adjustedTargetIndex : adjustedTargetIndex + 1;
  const safeInsertIndex = Math.max(
    0,
    Math.min(nextLaunchItemIds.length, insertIndex)
  );

  nextLaunchItemIds.splice(safeInsertIndex, 0, movedItemId);

  const didOrderChange = nextLaunchItemIds.some(
    (launchItemId, index) => launchItemId !== orderedLaunchItemIds[index]
  );

  return didOrderChange ? nextLaunchItemIds : null;
};

export function LaunchItemList({
  launchItems,
  onDeleteLaunchItem,
  onLaunchItem,
  onReorderLaunchItems,
  onSetLaunchItemEnabled
}: LaunchItemListProps) {
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
  const [dragOverPosition, setDragOverPosition] =
    useState<DropPosition>('before');

  const resetDragState = () => {
    setDraggingItemId(null);
    setDragOverItemId(null);
    setDragOverPosition('before');
  };

  const handleDragStart = (
    event: DragEvent<HTMLElement>,
    launchItemId: string
  ) => {
    setDraggingItemId(launchItemId);
    setDragOverItemId(null);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', launchItemId);
  };

  const handleDragOver = (
    event: DragEvent<HTMLElement>,
    launchItemId: string
  ) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    const nextDropPosition = getDropPosition(event);

    setDragOverItemId((currentItemId) =>
      currentItemId === launchItemId ? currentItemId : launchItemId
    );
    setDragOverPosition((currentPosition) =>
      currentPosition === nextDropPosition ? currentPosition : nextDropPosition
    );
  };

  const handleDragLeave = (
    event: DragEvent<HTMLElement>,
    launchItemId: string
  ) => {
    const nextTarget = event.relatedTarget;

    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return;
    }

    setDragOverItemId((currentItemId) =>
      currentItemId === launchItemId ? null : currentItemId
    );
  };

  const handleDrop = (
    event: DragEvent<HTMLElement>,
    targetItemId: string
  ) => {
    event.preventDefault();

    const sourceItemId =
      draggingItemId || event.dataTransfer.getData('text/plain');
    const nextDropPosition = getDropPosition(event);
    const nextLaunchItemIds = getReorderedLaunchItemIds(
      launchItems,
      sourceItemId,
      targetItemId,
      nextDropPosition
    );

    resetDragState();

    if (nextLaunchItemIds) {
      onReorderLaunchItems(nextLaunchItemIds);
    }
  };

  if (launchItems.length === 0) {
    return (
      <div className="empty-state">
        <strong>No launch items yet</strong>
        <span>Add a URL item to define the start order.</span>
      </div>
    );
  }

  return (
    <div className="launch-list">
      {launchItems.map((launchItem, index) => {
        const rowClasses = [
          'launch-row',
          launchItem.enabled ? '' : 'disabled',
          draggingItemId === launchItem.id ? 'dragging' : '',
          dragOverItemId === launchItem.id &&
          draggingItemId !== launchItem.id
            ? `drag-over ${dragOverPosition}`
            : ''
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <article
            className={rowClasses}
            draggable
            key={launchItem.id}
            onDragEnd={resetDragState}
            onDragLeave={(event) => handleDragLeave(event, launchItem.id)}
            onDragOver={(event) => handleDragOver(event, launchItem.id)}
            onDragStart={(event) => handleDragStart(event, launchItem.id)}
            onDrop={(event) => handleDrop(event, launchItem.id)}
          >
            <span
              className="drag-handle"
              aria-label={`Drag ${launchItem.title} to reorder`}
              title="Drag to reorder"
            >
              ⋮⋮
            </span>
            <div className="launch-main">
              <div className="launch-title-line">
                <span className="order-badge" aria-label="Launch order">
                  {formatOrder(index)}
                </span>
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
              <button
                className={
                  launchItem.enabled
                    ? 'toggle-indicator on'
                    : 'toggle-indicator'
                }
                type="button"
                role="switch"
                aria-checked={launchItem.enabled}
                title={
                  launchItem.enabled
                    ? 'Disable launch item'
                    : 'Enable launch item'
                }
                onClick={() =>
                  onSetLaunchItemEnabled(launchItem, !launchItem.enabled)
                }
              >
                <span aria-hidden="true" />
              </button>
              <button
                className="secondary-button"
                type="button"
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
        );
      })}
    </div>
  );
}
