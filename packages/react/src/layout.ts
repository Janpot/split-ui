export interface PanelState {
  kind: 'panel';
  elm: HTMLElement;
  flex: boolean;
  size: number;
  minSize: number;
  maxSize: number;
  childId: string;
}

export interface ResizerState {
  kind: 'resizer';
  elm: HTMLElement;
  size: number;
}

export type PanelsState = (PanelState | ResizerState)[];

import { CLASS_RESIZER, CLASS_PANEL, CSS_PROP_CHILD_FLEX } from './constants';
import { setSnapshot } from './store';

export type PanelChildId = string;

/**
 * Global observers for updating panel groups when they change
 */
let groupResizeObserver: ResizeObserver | null = null;
let groupMutationObserver: MutationObserver | null = null;

/**
 * Handles both resize and child changes for panel groups
 */
function handleGroupElmChanges(groupElement: HTMLElement): void {
  const currentLayout = extractState(groupElement);
  const layout = convertGroupStateToLayout(currentLayout);

  // Always apply ARIA attributes
  applyAriaToGroup(groupElement, layout);

  // Only apply layout changes if the group is dirty (has stored state)
  if (groupElement.dataset.dirty === 'true') {
    const newPanels = [...currentLayout.panels];
    assignFlex(newPanels);

    const updatedGroup: GroupState = {
      ...currentLayout,
      panels: newPanels,
    };

    const updatedLayout = convertGroupStateToLayout(updatedGroup);
    applyLayoutToGroup(updatedGroup, updatedLayout);
  }
}

/**
 * Gets or creates the global ResizeObserver instance
 */
function getGroupResizeObserver(): ResizeObserver {
  if (typeof window === 'undefined') {
    throw new Error('ResizeObserver is only available in browser environments');
  }

  groupResizeObserver ??= new ResizeObserver((entries) => {
    entries.forEach((entry) => {
      handleGroupElmChanges(entry.target as HTMLElement);
    });
  });

  return groupResizeObserver;
}

/**
 * Gets or creates the global MutationObserver instance
 */
function getGroupMutationObserver(): MutationObserver {
  if (typeof window === 'undefined') {
    throw new Error(
      'MutationObserver is only available in browser environments',
    );
  }

  groupMutationObserver ??= new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        handleGroupElmChanges(mutation.target as HTMLElement);
      }
    });
  });

  return groupMutationObserver;
}

/**
 * Subscribes a panel group element to both resize and child list changes
 * Returns an unsubscribe function
 */
export function subscribeGroupElmChanges(
  groupElement: HTMLDivElement,
): () => void {
  const resizeObserver = getGroupResizeObserver();
  const mutationObserver = getGroupMutationObserver();

  resizeObserver.observe(groupElement);
  mutationObserver.observe(groupElement, { childList: true });

  return () => {
    resizeObserver.unobserve(groupElement);
    mutationObserver.disconnect();
  };
}

/**
 * @deprecated Use subscribeGroupElmChanges instead
 */
export function subscribeGroupResize(groupElement: HTMLDivElement): () => void {
  return subscribeGroupElmChanges(groupElement);
}

export interface PanelLayout {
  percentage: number;
  flex: boolean;
  // ARIA attributes for resizer bounds
  ariaMin: number;
  ariaMax: number;
  ariaNow: number;
}

export interface GroupLayout {
  panels: Record<PanelChildId, PanelLayout>;
  isConstrained: 'min' | 'max' | null;
}

export interface GroupState {
  id: string;
  elm: HTMLElement;
  panels: PanelsState;
  size: number;
  orientation: 'horizontal' | 'vertical';
}

/**
 * Converts GroupState to GroupLayout with ARIA values
 */
export function convertGroupStateToLayout(group: GroupState): GroupLayout {
  const { panels, size: containerSize } = group;
  const panelLayouts: Record<PanelChildId, PanelLayout> = {};

  let currentPosition = 0;

  for (let i = 0; i < panels.length; i++) {
    const panel = panels[i];

    if (panel.kind === 'resizer') {
      currentPosition += panel.size;
    } else if (panel.kind === 'panel') {
      const percentage = (panel.size / containerSize) * 100;

      // Calculate ARIA bounds for resizer to the right of this panel
      // Split panels into left (up to current) and right (after current)
      const leftPanels = panels.slice(0, i + 1); // Include current panel
      const rightPanels = panels.slice(i + 1); // Panels after current

      // Calculate maximum movement in both directions
      const leftwardMovement = Math.min(
        calculateCollapseCapacity(leftPanels), // how much left can shrink
        calculateExpansionCapacity(rightPanels), // how much right can expand
      );

      const rightwardMovement = Math.min(
        calculateExpansionCapacity(leftPanels), // how much left can expand
        calculateCollapseCapacity(rightPanels), // how much right can shrink
      );

      // Current resizer position is at the end of this panel
      currentPosition = currentPosition + panel.size;

      panelLayouts[panel.childId] = {
        // Panel width
        percentage,
        flex: panel.flex,
        // Resizer bounds
        ariaMin: currentPosition - leftwardMovement,
        ariaMax: currentPosition + rightwardMovement,
        ariaNow: currentPosition,
      };
    }
  }

  return {
    panels: panelLayouts,
    isConstrained: null, // No constraint by default
  };
}

export function assignFlex(panels: (PanelState | ResizerState)[]): void {
  let lastPanel = null;
  let lastFlexPanel = null;

  for (const panel of panels) {
    if (panel.kind === 'panel') {
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
}

/**
 * Calculates new layout based on a resizer movement
 */
export function calculateNewLayout(
  group: GroupState,
  resizerIndex: number,
  resizerOffset: number,
): GroupLayout {
  const { panels } = group;

  // Validate inputs
  if (resizerIndex < 0 || resizerIndex >= panels.length) {
    throw new Error('Invalid resizer index');
  }

  const resizerElement = panels[resizerIndex];
  if (resizerElement.kind !== 'resizer') {
    throw new Error('Element at resizerIndex is not a resizer');
  }

  // Find the panels adjacent to the resizer
  const leftPanelIndex = resizerIndex - 1;
  const rightPanelIndex = resizerIndex + 1;

  if (leftPanelIndex < 0 || rightPanelIndex >= panels.length) {
    throw new Error('Resizer must have panels on both sides');
  }

  const leftPanel = panels[leftPanelIndex];
  const rightPanel = panels[rightPanelIndex];

  if (leftPanel.kind !== 'panel' || rightPanel.kind !== 'panel') {
    throw new Error('Adjacent elements must be panels');
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
  progressiveResize(newCollapsePanels, absMovement, 'collapse');
  progressiveResize(newExpandPanels, absMovement, 'expand');

  assignFlex(newPanels);

  // Convert to GroupLayout structure using the new conversion function
  const updatedGroup: GroupState = {
    ...group,
    panels: newPanels,
  };

  // Determine constraint
  let isConstrained: 'min' | 'max' | null = null;
  if (Math.abs(resizerOffset) > maxMovement && maxMovement > 0) {
    // Which capacity is limiting us?
    isConstrained = resizerOffset > 0 ? 'max' : 'min';
  }

  const layout = convertGroupStateToLayout(updatedGroup);
  return {
    ...layout,
    isConstrained,
  };
}

/**
 * Calculates how much space can be freed up by collapsing panels
 */
function calculateCollapseCapacity(panels: PanelsState): number {
  let capacity = 0;

  for (const panel of panels) {
    if (panel.kind === 'panel') {
      // How much can this panel shrink?
      capacity += Math.max(0, panel.size - panel.minSize);
    }
  }

  return capacity;
}

/**
 * Calculates how much space can be consumed by expanding panels to their maximum size
 */
function calculateExpansionCapacity(panels: PanelsState): number {
  let capacity = 0;

  for (const panel of panels) {
    if (panel.kind === 'panel') {
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
  relevantPanels: PanelsState,
  targetAmount: number,
  operation: 'collapse' | 'expand',
): number {
  let remainingAmount = targetAmount;

  // Process panels (already in correct order)
  for (const panel of relevantPanels) {
    if (remainingAmount <= 0) break;

    if (panel.kind === 'panel') {
      const available =
        operation === 'collapse'
          ? Math.max(0, panel.size - panel.minSize)
          : Math.max(0, panel.maxSize - panel.size);

      const resizeAmount = Math.min(remainingAmount, available);

      if (operation === 'collapse') {
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
export function extractState(groupElm: HTMLElement): GroupState {
  const computedStyle = getComputedStyle(groupElm);
  const isVertical =
    computedStyle.flexDirection === 'column' ||
    computedStyle.flexDirection === 'column-reverse';

  const layout: PanelsState = [];
  const groupId = groupElm.dataset.groupId;
  if (!groupId) {
    throw new Error('Group element must have a data-panel-id attribute');
  }

  for (const child of groupElm.children) {
    const htmlChild = child as HTMLElement;
    if (htmlChild.classList.contains(CLASS_RESIZER)) {
      // This is a resizer
      const size = isVertical ? htmlChild.offsetHeight : htmlChild.offsetWidth;
      layout.push({
        kind: 'resizer',
        elm: htmlChild,
        size,
      });
    } else if (htmlChild.classList.contains(CLASS_PANEL)) {
      // This is a panel
      const childId = htmlChild.dataset.childId;
      if (!childId) {
        throw new Error('Panel must have a data-child-id attribute');
      }

      const size = isVertical ? htmlChild.offsetHeight : htmlChild.offsetWidth;
      const childStyle = getComputedStyle(htmlChild);

      // Extract constraints from CSS
      const minSizeValue = isVertical
        ? childStyle.minHeight
        : childStyle.minWidth;
      const maxSizeValue = isVertical
        ? childStyle.maxHeight
        : childStyle.maxWidth;

      const minSize = parseFloat(minSizeValue);
      const maxSize =
        maxSizeValue === 'none' ? Infinity : parseFloat(maxSizeValue);

      const flex = htmlChild.dataset.flex === 'true';

      layout.push({
        kind: 'panel',
        elm: htmlChild,
        childId,
        flex,
        size,
        minSize,
        maxSize,
      });
    } else if (htmlChild.tagName === 'SCRIPT') {
      // Skip hydration scripts
      continue;
    } else {
      console.warn('Unknown element in panel group:', htmlChild);
      continue;
    }
  }

  // Calculate container size
  const containerSize = isVertical
    ? groupElm.offsetHeight
    : groupElm.offsetWidth;

  return {
    id: groupId,
    elm: groupElm,
    panels: layout,
    size: containerSize,
    orientation: isVertical ? 'vertical' : 'horizontal',
  };
}

/**
 * Finds the  panel element that precedes the resizer
 */
function findPrecedingPanel(resizer: Element): Element | null {
  let current = resizer.previousElementSibling;

  while (current) {
    if (current.classList.contains(CLASS_RESIZER)) {
      return null;
    } else if (current.classList.contains(CLASS_PANEL)) {
      return current;
    }
    current = current.previousElementSibling;
  }

  return null;
}

/**
 * Finds the panel element that follows the resizer
 */
function findFollowingPanel(resizer: Element): Element | null {
  let current = resizer.nextElementSibling;

  while (current) {
    if (current.classList.contains(CLASS_RESIZER)) {
      return null;
    } else if (current.classList.contains(CLASS_PANEL)) {
      return current;
    }
    current = current.nextElementSibling;
  }

  return null;
}

/**
 * Applies ARIA attributes to resizers within a group element
 */
export function applyAriaToGroup(
  groupElm: HTMLElement,
  layout: GroupLayout,
): void {
  for (const child of groupElm.children) {
    if (!child.classList.contains(CLASS_RESIZER)) continue;

    const resizer = child;

    const precedingPanel = findPrecedingPanel(resizer);
    const followingPanel = findFollowingPanel(resizer);

    // Get panel data
    const precedingPanelData = precedingPanel
      ? layout.panels[precedingPanel.id]
      : null;

    // Set ARIA attributes
    resizer.setAttribute(
      'aria-valuemin',
      String(precedingPanelData?.ariaMin ?? 0),
    );
    resizer.setAttribute(
      'aria-valuemax',
      String(precedingPanelData?.ariaMax ?? 0),
    );
    resizer.setAttribute(
      'aria-valuenow',
      String(precedingPanelData?.ariaNow ?? 0),
    );
    resizer.setAttribute(
      'aria-controls',
      [precedingPanel?.id, followingPanel?.id].filter(Boolean).join(' '),
    );
  }
}

/**
 * Applies layout and saves snapshots for all panels
 */
function saveSnapshots(groupId: string, layout: GroupLayout): void {
  const flexValues: Record<string, string> = {};
  for (const [childId, { flex, percentage }] of Object.entries(layout.panels)) {
    const flexValue = flex ? '1' : `0 0 ${percentage}%`;
    flexValues[childId] = flexValue;
  }
  setSnapshot(groupId, { flexValues });
}

/**
 * Applies layout percentages to CSS variables on a group element
 */
export function applyLayoutToGroup(
  group: GroupState,
  layout: GroupLayout,
  commit: boolean = true,
): void {
  for (const [childId, { flex, percentage }] of Object.entries(layout.panels)) {
    group.elm.style.setProperty(
      CSS_PROP_CHILD_FLEX(childId),
      flex ? '1' : `0 0 ${percentage}%`,
    );
  }

  // Only save snapshots when committing (not during drag)
  if (commit) {
    saveSnapshots(group.id, layout);
  }

  // Apply ARIA attributes to resizers
  applyAriaToGroup(group.elm, layout);
}
