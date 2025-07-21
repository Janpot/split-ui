"use client";

import React, { useCallback, useRef } from "react";
import { calculateNewLayout, extractLayout, GroupDefinition } from "./layout";
import { setSnapshot } from "./store";

/**
 * Applies layout percentages to CSS variables on a group element
 */
function applyLayoutToGroup(
  groupElm: HTMLElement,
  group: GroupDefinition
): void {
  const { panels, size: containerSize } = group;
  const children = Array.from(groupElm.children) as HTMLElement[];
  const childById = new Map<string, HTMLElement>();

  for (const child of children) {
    const panelId = child.dataset?.panelId;
    if (panelId) {
      childById.set(panelId, child);
    }
  }

  for (const panel of panels) {
    if (panel.kind === "panel") {
      const child = childById.get(panel.id);

      if (!child) {
        throw new Error(`Panel with ID ${panel.id} not found in group element`);
      }

      const percentage = (panel.size / containerSize) * 100;
      panel.elm.style.setProperty(
        `--rfp-flex`,
        panel.flex ? "1" : `0 0 ${percentage}%`
      );
    }
  }
}

interface DragState {
  startPos: number;
  groupElement: HTMLElement;
  isVertical: boolean;
  initialGroup: GroupDefinition;
  resizerIndex: number;
}

export interface ResizerProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Resizer: React.FC<ResizerProps> = ({
  className = "",
  style = {},
}) => {
  const dragState = useRef<DragState | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.current) return;

    const currentPos = dragState.current.isVertical ? e.clientY : e.clientX;
    const offset = currentPos - dragState.current.startPos;

    // Calculate new layout using the abstracted function
    const newGroup = calculateNewLayout(
      dragState.current.initialGroup,
      dragState.current.resizerIndex,
      offset
    );

    // Apply the new layout to the group element
    applyLayoutToGroup(dragState.current.groupElement, newGroup);
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!dragState.current) return;

    // Get final layout from DOM to account for any constraints that were applied
    const finalGroup = extractLayout(dragState.current.groupElement);

    for (const element of finalGroup.panels) {
      if (element.kind === "panel") {
        if (element.id) {
          const percentage = (element.size / finalGroup.size) * 100;
          setSnapshot(element.id, {
            flexValue: element.flex ? "1" : `0 0 ${percentage}%`,
            percent: element.flex ? null : percentage,
          });
        }
      }
    }

    // Cleanup - set dragState to null
    dragState.current = null;

    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    // Remove CSS classes for resize state
    document.body.classList.remove(
      "rfp-resizing",
      "rfp-vertical",
      "rfp-horizontal"
    );
  }, [handleMouseMove]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();

      const resizer = e.currentTarget as HTMLElement;
      const group = resizer.closest(".rfp-panel-group") as HTMLElement;
      if (!group) {
        throw new Error("Resizer must be placed within a panel group element");
      }

      const computedStyle = getComputedStyle(group);
      const flexDirection = computedStyle.flexDirection;
      const isVertical =
        flexDirection === "column" || flexDirection === "column-reverse";

      // Extract initial layout from the DOM
      const groupLayout = extractLayout(group);

      // Find the index of the clicked resizer
      const clickedResizerIndex = groupLayout.panels.findIndex(
        (panel) => panel.kind === "resizer" && panel.elm === resizer
      );

      // Create drag state object
      dragState.current = {
        startPos: isVertical ? e.clientY : e.clientX,
        groupElement: group,
        isVertical,
        initialGroup: groupLayout,
        resizerIndex: clickedResizerIndex,
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      // Add CSS classes for resize state
      document.body.classList.add(
        "rfp-resizing",
        isVertical ? "rfp-vertical" : "rfp-horizontal"
      );
    },
    [handleMouseMove, handleMouseUp]
  );

  const classes = ["rfp-resizer", className].filter(Boolean).join(" ");

  return (
    <div className={classes} style={style} onMouseDown={handleMouseDown} />
  );
};
