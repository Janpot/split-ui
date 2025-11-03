import {
  CLASS_RESIZER,
  CLASS_PANEL,
  CSS_PROP_CHILD_FLEX,
  CLASS_PANEL_GROUP,
  CLASS_RESIZING,
  CLASS_VERTICAL,
  CLASS_HORIZONTAL,
  CLASS_CONSTRAINED_MIN,
  CLASS_CONSTRAINED_MAX,
} from './constants';
import { setSnapshot } from './store';
import type * as React from 'react';

export type AbstractPointerEvent = PointerEvent | React.PointerEvent;
export type AbstractKeyboardEvent = KeyboardEvent | React.KeyboardEvent;

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

export type PanelChildId = string;

/**
 * Global drag state - only one resizer can be dragged at a time
 */
interface DragState {
  startPos: number;
  groupElement: HTMLElement;
  initialGroup: GroupState;
  resizerIndex: number;
}

let currentDragState: DragState | null = null;

/**
 * Finds the index of a resizer element within a group's panels
 */
function findResizerIndex(group: GroupState, resizerElm: HTMLElement): number {
  return group.panels.findIndex(
    (panel) => panel.kind === 'resizer' && panel.elm === resizerElm,
  );
}

/**
 * Extracts position from pointer event
 */
function getEventPosition(
  event: AbstractPointerEvent,
  orientation: 'horizontal' | 'vertical',
): number {
  switch (orientation) {
    case 'vertical':
      return event.clientY;
    case 'horizontal':
      return event.clientX;
  }
}

/**
 * Inverts a numeric value if the element is in RTL mode
 */
function invertOnRtl(elm: HTMLElement, value: number): number {
  const isRTL = getComputedStyle(elm).direction === 'rtl';
  return isRTL ? -value : value;
}

/**
 * Calculates pointer event offset with RTL awareness for horizontal orientation
 */
function getPointerEventOffset(
  event: AbstractPointerEvent,
  dragState: DragState,
): number {
  const currentPos = getEventPosition(
    event,
    dragState.initialGroup.orientation,
  );
  const offset = currentPos - dragState.startPos;

  // Only invert for horizontal orientation in RTL mode
  if (dragState.initialGroup.orientation === 'horizontal') {
    return invertOnRtl(dragState.groupElement, offset);
  }

  return offset;
}

function getGroupForResizer(resizer: HTMLElement): HTMLElement {
  const groupElm = resizer.parentElement;
  if (!groupElm || !groupElm.classList.contains(CLASS_PANEL_GROUP)) {
    throw new Error('Resizer must be placed within a panel group element');
  }
  return groupElm;
}

function getKeyEventOffset(
  event: AbstractKeyboardEvent,
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
    const target = event.currentTarget as HTMLElement;

    if (event.key === 'ArrowLeft') {
      offset = -step;
    } else if (event.key === 'ArrowRight') {
      offset = step;
    }

    offset = invertOnRtl(target, offset);
  }

  return offset;
}

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
 * Track observed elements for proper cleanup
 */
const observedElements = new Set<HTMLElement>();

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
  observedElements.add(groupElement);

  return () => {
    resizeObserver.unobserve(groupElement);
    observedElements.delete(groupElement);
    
    // Only disconnect if no more elements are being observed
    if (observedElements.size === 0) {
      mutationObserver.disconnect();
    }
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

// Unlike width, min-width and max-width may return percentages
function getPixelWidth(length: string, parentSize: number): number {
  if (length.endsWith('%')) {
    const percentage = parseFloat(length);
    return (percentage / 100) * parentSize;
  }

  return parseFloat(length);
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

      const parentSize = isVertical
        ? groupElm.offsetHeight
        : groupElm.offsetWidth;

      const minSize = getPixelWidth(minSizeValue, parentSize);
      const maxSize =
        maxSizeValue === 'none'
          ? Infinity
          : getPixelWidth(maxSizeValue, parentSize);

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

  // Only save snapshots and update ARIA when committing (not during drag)
  // This improves performance during drag operations
  if (commit) {
    saveSnapshots(group.id, layout);
    applyAriaToGroup(group.elm, layout);
  }
}

/**
 * Global pointer move handler for resize operations
 */
export function handlePointerMove(event: AbstractPointerEvent) {
  if (!currentDragState) return;

  event.preventDefault();

  const offset = getPointerEventOffset(event, currentDragState);

  // Calculate new layout using the abstracted function
  const newLayout = calculateNewLayout(
    currentDragState.initialGroup,
    currentDragState.resizerIndex,
    offset,
  );

  // Update constrained class based on constraint state
  document.body.classList.toggle(
    CLASS_CONSTRAINED_MIN,
    newLayout.isConstrained === 'min',
  );
  document.body.classList.toggle(
    CLASS_CONSTRAINED_MAX,
    newLayout.isConstrained === 'max',
  );

  applyLayoutToGroup(currentDragState.initialGroup, newLayout, false);
}

/**
 * Global pointer up handler for resize operations
 */
export function handlePointerUp(event: AbstractPointerEvent) {
  if (!currentDragState) return;

  document.removeEventListener('pointermove', handlePointerMove);
  document.removeEventListener('pointerup', handlePointerUp);

  const offset = getPointerEventOffset(event, currentDragState);

  // Calculate new layout using the abstracted function
  const endLayout = calculateNewLayout(
    currentDragState.initialGroup,
    currentDragState.resizerIndex,
    offset,
  );

  applyLayoutToGroup(currentDragState.initialGroup, endLayout, true);

  // Cleanup - clear global drag state
  currentDragState = null;

  // Remove CSS classes for resize state
  document.body.classList.remove(
    CLASS_RESIZING,
    CLASS_VERTICAL,
    CLASS_HORIZONTAL,
    CLASS_CONSTRAINED_MIN,
    CLASS_CONSTRAINED_MAX,
  );
}

/**
 * Global keyboard handler for resize operations
 */
export function handleKeyDown(event: AbstractKeyboardEvent) {
  const resizer = event.currentTarget as HTMLElement;
  const groupElm = getGroupForResizer(resizer);
  const groupState = extractState(groupElm);

  const offset = getKeyEventOffset(event, groupState.orientation);

  if (offset === 0) {
    return;
  }

  event.preventDefault();

  const resizerIndex = findResizerIndex(groupState, resizer);
  const newLayout = calculateNewLayout(groupState, resizerIndex, offset);
  applyLayoutToGroup(groupState, newLayout);
}

/**
 * Internal shared logic for starting resize operations
 */
function startResizeOperation(event: AbstractPointerEvent) {
  event.preventDefault();
  const resizer = event.currentTarget as HTMLElement;

  // Blur any currently focused resizer to maintain proper focus state
  const activeElement = document.activeElement;
  if (activeElement && activeElement.classList.contains(CLASS_RESIZER)) {
    (activeElement as HTMLElement).blur();
  }

  const group = getGroupForResizer(resizer);
  const groupState = extractState(group);

  // Find the index of the clicked resizer
  const clickedResizerIndex = findResizerIndex(groupState, resizer);

  // Create global drag state
  currentDragState = {
    startPos: getEventPosition(event, groupState.orientation),
    groupElement: group,
    initialGroup: groupState,
    resizerIndex: clickedResizerIndex,
  };

  document.addEventListener('pointermove', handlePointerMove);
  document.addEventListener('pointerup', handlePointerUp);

  // Add CSS classes for resize state
  document.body.classList.add(
    CLASS_RESIZING,
    groupState.orientation === 'vertical' ? CLASS_VERTICAL : CLASS_HORIZONTAL,
  );
}

/**
 * Global pointer down handler for resize operations
 */
export function handlePointerDown(event: AbstractPointerEvent) {
  // Only handle primary pointer (left mouse button, first touch, etc.)
  if (!event.isPrimary) return;

  // Only handle left mouse button (button 0) or touch events
  if (event.button !== 0) return;
  startResizeOperation(event);
}
