import React, { useCallback, useRef } from "react";
import { calculateNewLayout, extractLayout, GroupDefinition } from "./layout";
import { setSnapshot } from "./store";
import { GroupContext } from "./GroupContext";

/**
 * Applies layout percentages to CSS variables on a group element
 */
function applyLayoutToGroup(
  groupElm: HTMLElement,
  group: GroupDefinition,
): void {
  const { panels, size: containerSize } = group;

  for (const panel of panels) {
    if (panel.kind === "panel") {
      const percentage = (panel.size / containerSize) * 100;
      groupElm.style.setProperty(
        `--rfp-flex-${panel.childId}`,
        panel.flex ? "1" : `0 0 ${percentage}%`,
      );
    }
  }
}

/**
 * Applies layout and saves snapshots for all panels
 */
function saveSnapshots(group: GroupDefinition): void {
  const flexValues: Record<string, string> = {};
  for (const element of group.panels) {
    if (element.kind === "panel") {
      const percentage = (element.size / group.size) * 100;
      const flexValue = element.flex ? "1" : `0 0 ${percentage}%`;
      flexValues[element.childId] = flexValue;
    }
  }
  setSnapshot(group.id, { flexValues });
}

/**
 * Finds the index of a resizer element within a group's panels
 */
function findResizerIndex(
  group: GroupDefinition,
  resizerElm: HTMLElement,
): number {
  return group.panels.findIndex(
    (panel) => panel.kind === "resizer" && panel.elm === resizerElm,
  );
}

interface DragState {
  startPos: number;
  groupElement: HTMLElement;
  initialGroup: GroupDefinition;
  resizerIndex: number;
}

/**
 * Extracts position from mouse or touch event
 */
function getEventPosition(
  event: MouseEvent | TouchEvent,
  orientation: "horizontal" | "vertical",
): number {
  const eventOrTouch: MouseEvent | Touch =
    event instanceof TouchEvent ? event.touches[0] : event;

  switch (orientation) {
    case "vertical":
      return eventOrTouch.clientY;
    case "horizontal":
      return eventOrTouch.clientX;
  }
}

export interface ResizerProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const Resizer: React.FC<ResizerProps> = ({
  className = "",
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
    const newGroup = calculateNewLayout(
      dragState.current.initialGroup,
      dragState.current.resizerIndex,
      offset,
    );

    // Apply the new layout to the group element
    applyLayoutToGroup(dragState.current.groupElement, newGroup);
  }, []);

  const handleEnd = useCallback(() => {
    if (!dragState.current) return;

    // Get final layout from DOM to account for any constraints that were applied
    const finalGroup = extractLayout(dragState.current.groupElement);
    saveSnapshots(finalGroup);

    // Cleanup - set dragState to null
    dragState.current = null;

    document.removeEventListener("mousemove", handleMove);
    document.removeEventListener("mouseup", handleEnd);
    document.removeEventListener("touchmove", handleMove);
    document.removeEventListener("touchend", handleEnd);

    // Remove CSS classes for resize state
    document.body.classList.remove(
      "rfp-resizing",
      "rfp-vertical",
      "rfp-horizontal",
    );
  }, [handleMove]);

  const handleStart = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      // Only handle left mouse button for mouse events
      if ("button" in event && event.button !== 0) return;

      event.preventDefault();

      const resizer = event.currentTarget as HTMLElement;
      const group = resizer.closest(".rfp-panel-group") as HTMLElement;
      if (!group) {
        throw new Error("Resizer must be placed within a panel group element");
      }

      // Extract initial layout from the DOM
      const groupLayout = extractLayout(group);
      const orientation = groupLayout.orientation;

      // Find the index of the clicked resizer
      const clickedResizerIndex = findResizerIndex(groupLayout, resizer);

      // Create drag state object
      dragState.current = {
        startPos: getEventPosition(event.nativeEvent, orientation),
        groupElement: group,
        initialGroup: groupLayout,
        resizerIndex: clickedResizerIndex,
      };

      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleEnd);
      document.addEventListener("touchmove", handleMove, { passive: false });
      document.addEventListener("touchend", handleEnd);

      // Add CSS classes for resize state
      document.body.classList.add("rfp-resizing", `rfp-${orientation}`);
    },
    [handleMove, handleEnd],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const step =
        event.ctrlKey || event.metaKey ? 1 : event.shiftKey ? 50 : 10; // Fine step with Ctrl/Cmd, larger steps with Shift
      let offset = 0;

      const resizer = event.currentTarget;
      const group = resizer.closest(".rfp-panel-group") as HTMLElement;
      if (!group) return;

      const groupLayout = extractLayout(group);
      const orientation = groupLayout.orientation;

      if (orientation === "vertical") {
        if (event.key === "ArrowUp") {
          offset = -step;
        } else if (event.key === "ArrowDown") {
          offset = step;
        }
      } else {
        if (event.key === "ArrowLeft") {
          offset = -step;
        } else if (event.key === "ArrowRight") {
          offset = step;
        }
      }

      if (offset === 0) {
        return;
      }

      event.preventDefault();

      const resizerIndex = findResizerIndex(groupLayout, resizer);
      const finalGroup = calculateNewLayout(groupLayout, resizerIndex, offset);
      saveSnapshots(finalGroup);
    },
    [],
  );

  const classes = ["rfp-resizer", className].filter(Boolean).join(" ");

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
