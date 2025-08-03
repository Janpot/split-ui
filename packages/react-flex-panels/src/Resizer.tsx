import React, { useCallback, useRef } from 'react';
import {
  calculateNewLayout,
  extractState,
  GroupState,
  applyLayoutToGroup,
  GroupLayout,
} from './layout';
import { setSnapshot } from './store';
import { GroupContext } from './GroupContext';
import {
  CLASS_PANEL_GROUP,
  CLASS_RESIZER,
  CLASS_RESIZING,
  CLASS_VERTICAL,
  CLASS_HORIZONTAL,
} from './constants';

/**
 * Applies layout and saves snapshots for all panels
 */
function saveSnapshots(groupId: string, layout: GroupLayout): void {
  const flexValues: Record<string, string> = {};
  for (const [childId, { flex, percentage }] of Object.entries(layout)) {
    const flexValue = flex ? '1' : `0 0 ${percentage}%`;
    flexValues[childId] = flexValue;
  }
  setSnapshot(groupId, { flexValues });
}

/**
 * Finds the index of a resizer element within a group's panels
 */
function findResizerIndex(group: GroupState, resizerElm: HTMLElement): number {
  return group.panels.findIndex(
    (panel) => panel.kind === 'resizer' && panel.elm === resizerElm,
  );
}

interface DragState {
  startPos: number;
  groupElement: HTMLElement;
  initialGroup: GroupState;
  resizerIndex: number;
}

/**
 * Extracts position from mouse or touch event
 */
function getEventPosition(
  event: MouseEvent | TouchEvent,
  orientation: 'horizontal' | 'vertical',
): number {
  const eventOrTouch: MouseEvent | Touch =
    event instanceof TouchEvent ? event.touches[0] : event;

  switch (orientation) {
    case 'vertical':
      return eventOrTouch.clientY;
    case 'horizontal':
      return eventOrTouch.clientX;
  }
}

function getGroupForResizer(resizer: HTMLElement): HTMLElement {
  const groupElm = resizer.parentElement;
  if (!groupElm || !groupElm.classList.contains(CLASS_PANEL_GROUP)) {
    throw new Error('Resizer must be placed within a panel group element');
  }
  return groupElm;
}

function getKeyEventOffset(
  event: React.KeyboardEvent<HTMLDivElement>,
  orientation: 'horizontal' | 'vertical',
): number {
  const step = event.ctrlKey || event.metaKey ? 1 : event.shiftKey ? 50 : 10; // Fine step with Ctrl/Cmd, larger steps with Shift
  let offset = 0;

  if (orientation === 'vertical') {
    if (event.key === 'ArrowUp') {
      offset = -step;
    } else if (event.key === 'ArrowDown') {
      offset = step;
    }
  } else {
    if (event.key === 'ArrowLeft') {
      offset = -step;
    } else if (event.key === 'ArrowRight') {
      offset = step;
    }
  }

  return offset;
}

export interface ResizerProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const Resizer: React.FC<ResizerProps> = ({
  className = '',
  style = {},
  ...props
}) => {
  const dragState = useRef<DragState | null>(null);
  const group = React.useContext(GroupContext);

  const handleMove = useCallback((event: MouseEvent | TouchEvent) => {
    if (!dragState.current) return;

    event.preventDefault();

    const orientation = dragState.current.initialGroup.orientation;
    const currentPos = getEventPosition(event, orientation);
    const offset = currentPos - dragState.current.startPos;

    // Calculate new layout using the abstracted function
    const newLayout = calculateNewLayout(
      dragState.current.initialGroup,
      dragState.current.resizerIndex,
      offset,
    );

    applyLayoutToGroup(dragState.current.groupElement, newLayout);
  }, []);

  const handleEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!dragState.current) return;

      const currentPos = getEventPosition(
        event,
        dragState.current.initialGroup.orientation,
      );

      const offset = currentPos - dragState.current.startPos;

      // Calculate new layout using the abstracted function
      const endLayout = calculateNewLayout(
        dragState.current.initialGroup,
        dragState.current.resizerIndex,
        offset,
      );

      applyLayoutToGroup(dragState.current.groupElement, endLayout);

      saveSnapshots(dragState.current.initialGroup.id, endLayout);

      // Cleanup - set dragState to null
      dragState.current = null;

      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);

      // Remove CSS classes for resize state
      document.body.classList.remove(
        CLASS_RESIZING,
        CLASS_VERTICAL,
        CLASS_HORIZONTAL,
      );
    },
    [handleMove],
  );

  const handleStart = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      // Only handle left mouse button for mouse events
      if ('button' in event && event.button !== 0) return;

      event.preventDefault();

      // Blur any currently focused resizer to maintain proper focus state
      const activeElement = document.activeElement;
      if (activeElement && activeElement.classList.contains(CLASS_RESIZER)) {
        (activeElement as HTMLElement).blur();
      }

      const resizer = event.currentTarget as HTMLElement;
      const group = getGroupForResizer(resizer);
      const groupState = extractState(group);

      // Find the index of the clicked resizer
      const clickedResizerIndex = findResizerIndex(groupState, resizer);

      // Create drag state object
      dragState.current = {
        startPos: getEventPosition(event.nativeEvent, groupState.orientation),
        groupElement: group,
        initialGroup: groupState,
        resizerIndex: clickedResizerIndex,
      };

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleMove, { passive: false });
      document.addEventListener('touchend', handleEnd);

      // Add CSS classes for resize state
      document.body.classList.add(
        CLASS_RESIZING,
        groupState.orientation === 'vertical'
          ? CLASS_VERTICAL
          : CLASS_HORIZONTAL,
      );
    },
    [handleMove, handleEnd],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const resizer = event.currentTarget;
      const groupElm = getGroupForResizer(resizer);
      const groupState = extractState(groupElm);

      const offset = getKeyEventOffset(event, groupState.orientation);

      if (offset === 0) {
        return;
      }

      event.preventDefault();

      const resizerIndex = findResizerIndex(groupState, resizer);
      const newLayout = calculateNewLayout(groupState, resizerIndex, offset);
      applyLayoutToGroup(groupElm, newLayout);
      saveSnapshots(groupState.id, newLayout);
    },
    [],
  );

  const classes = [CLASS_RESIZER, className].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      style={style}
      tabIndex={0}
      role="separator"
      aria-orientation={group?.orientation}
      aria-label="Resize panels"
      onMouseDown={handleStart}
      onTouchStart={handleStart}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
};
