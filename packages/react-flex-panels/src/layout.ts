export interface PanelDefinition {
  kind: "panel";
  elm: HTMLElement;
  id: string;
  flex: boolean;
  size: number;
  minSize: number;
  maxSize: number;
}

export interface ResizerDefinition {
  kind: "resizer";
  elm: HTMLElement;
  size: number;
}

export type PanelsDefinition = (PanelDefinition | ResizerDefinition)[];

export interface GroupDefinition {
  panels: PanelsDefinition;
  size: number;
  orientation: 'horizontal' | 'vertical';
}

/**
 * Calculates new layout based on a resizer movement
 */
export function calculateNewLayout(
  group: GroupDefinition,
  resizerIndex: number,
  resizerOffset: number,
): GroupDefinition {
  const { panels, size: containerSize } = group;

  // Validate inputs
  if (resizerIndex < 0 || resizerIndex >= panels.length) {
    throw new Error("Invalid resizer index");
  }

  const resizerElement = panels[resizerIndex];
  if (resizerElement.kind !== "resizer") {
    throw new Error("Element at resizerIndex is not a resizer");
  }

  // Find the panels adjacent to the resizer
  const leftPanelIndex = resizerIndex - 1;
  const rightPanelIndex = resizerIndex + 1;

  if (leftPanelIndex < 0 || rightPanelIndex >= panels.length) {
    throw new Error("Resizer must have panels on both sides");
  }

  const leftPanel = panels[leftPanelIndex];
  const rightPanel = panels[rightPanelIndex];

  if (leftPanel.kind !== "panel" || rightPanel.kind !== "panel") {
    throw new Error("Adjacent elements must be panels");
  }

  // Determine direction: positive offset means resizer moves right (expand left, collapse right), negative means resizer moves left (expand right, collapse left)
  const isMovingRight = resizerOffset > 0;

  // Pre-slice panels for reuse, with semantic naming based on what actually happens
  const leftPanels = panels.slice(0, resizerIndex).reverse();
  const rightPanels = panels.slice(resizerIndex + 1);
  const collapsePanels = isMovingRight ? rightPanels : leftPanels;
  const expandPanels = isMovingRight ? leftPanels : rightPanels;

  // Calculate maximum movement capacity
  const collapseCapacity = calculateCollapseCapacity(collapsePanels);
  const expansionCapacity = calculateExpansionCapacity(expandPanels);
  const maxMovement = Math.min(collapseCapacity, expansionCapacity);

  // Actual movement is limited by both the requested offset and the maximum possible movement
  const actualMovement =
    Math.min(Math.abs(resizerOffset), maxMovement) * (isMovingRight ? 1 : -1);

  if (actualMovement === 0) {
    // No movement possible
    return group;
  }

  // Create a copy of panels to work with
  const newPanels = panels.map((panel) => ({ ...panel }));

  // Progressive collapse and expansion
  const absMovement = Math.abs(actualMovement);

  // Get corresponding slices from the copied panels with semantic naming
  const newLeftPanels = newPanels.slice(0, resizerIndex).reverse();
  const newRightPanels = newPanels.slice(resizerIndex + 1);
  const newCollapsePanels = isMovingRight ? newRightPanels : newLeftPanels;
  const newExpandPanels = isMovingRight ? newLeftPanels : newRightPanels;

  // Perform the resize operations
  progressiveResize(newCollapsePanels, absMovement, "collapse");
  progressiveResize(newExpandPanels, absMovement, "expand");

  let lastPanel = null;
  let lastFlexPanel = null;

  for (const panel of newPanels) {
    if (panel.kind === "panel") {
      lastPanel = panel;
      if (panel.flex) {
        lastFlexPanel = panel;
      }
      panel.flex = false; // Reset flex for all panels
    }
  }

  const flexPanel = lastFlexPanel ?? lastPanel;
  if (flexPanel) {
    flexPanel.flex = true; // Ensure at least one panel remains flexible
  }

  return {
    panels: newPanels,
    size: containerSize,
    orientation: group.orientation,
  };
}

/**
 * Calculates how much space can be freed up by collapsing panels
 */
function calculateCollapseCapacity(panels: PanelsDefinition): number {
  let capacity = 0;

  for (const panel of panels) {
    if (panel.kind === "panel") {
      // How much can this panel shrink?
      capacity += Math.max(0, panel.size - panel.minSize);
    }
  }

  return capacity;
}

/**
 * Calculates how much space can be consumed by expanding panels
 */
function calculateExpansionCapacity(panels: PanelsDefinition): number {
  let capacity = 0;

  for (const panel of panels) {
    if (panel.kind === "panel") {
      // How much can this panel grow?
      capacity += Math.max(0, panel.maxSize - panel.size);
    }
  }

  return capacity;
}

/**
 * Progressively resizes panels in the specified direction
 */
function progressiveResize(
  relevantPanels: PanelsDefinition,
  targetAmount: number,
  operation: "collapse" | "expand",
): number {
  let remainingAmount = targetAmount;

  // Process panels (already in correct order)
  for (const panel of relevantPanels) {
    if (remainingAmount <= 0) break;

    if (panel.kind === "panel") {
      const available =
        operation === "collapse"
          ? Math.max(0, panel.size - panel.minSize)
          : Math.max(0, panel.maxSize - panel.size);

      const resizeAmount = Math.min(remainingAmount, available);

      if (operation === "collapse") {
        panel.size -= resizeAmount;
      } else {
        panel.size += resizeAmount;
      }

      remainingAmount -= resizeAmount;
    }
  }

  return targetAmount - remainingAmount;
}

/**
 * Extracts the current layout from a DOM element
 */
export function extractLayout(groupElm: HTMLElement): GroupDefinition {
  const computedStyle = getComputedStyle(groupElm);
  const isVertical =
    computedStyle.flexDirection === "column" ||
    computedStyle.flexDirection === "column-reverse";

  const children = Array.from(groupElm.children) as HTMLElement[];
  const layout: PanelsDefinition = [];

  for (const child of children) {
    if (child.classList.contains("rfp-resizer")) {
      // This is a resizer
      const size = isVertical ? child.offsetHeight : child.offsetWidth;
      layout.push({
        kind: "resizer",
        elm: child,
        size,
      });
    } else if (child.classList.contains("rfp-panel")) {
      // This is a panel
      const id = child.dataset.panelId;
      if (!id) {
        throw new Error("Panel must have a data-panel-id attribute");
      }

      const size = isVertical ? child.offsetHeight : child.offsetWidth;
      const childStyle = getComputedStyle(child);

      // Extract constraints from CSS
      const minSizeValue = isVertical
        ? childStyle.minHeight
        : childStyle.minWidth;
      const maxSizeValue = isVertical
        ? childStyle.maxHeight
        : childStyle.maxWidth;

      const minSize =
        minSizeValue === "0px" ? 0 : parseFloat(minSizeValue) || 0;
      const maxSize =
        maxSizeValue === "none"
          ? Infinity
          : parseFloat(maxSizeValue) || Infinity;

      // Determine if this is a flex panel
      const flexGrow = parseFloat(childStyle.flexGrow) || 0;
      const flex = flexGrow > 0;

      layout.push({
        kind: "panel",
        elm: child,
        id,
        flex,
        size,
        minSize,
        maxSize,
      });
    }
  }

  // Calculate container size
  const containerSize = isVertical
    ? groupElm.offsetHeight
    : groupElm.offsetWidth;

  return {
    panels: layout,
    size: containerSize,
    orientation: isVertical ? 'vertical' : 'horizontal',
  };
}
