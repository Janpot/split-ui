import { CLASS_RESIZER, CSS_PROP_CHILD_FLEX } from './constants';
import { setSnapshot } from './store';
import { attributeListValues } from './utils';
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
 * Injects a style tag to disable pointer events on iframes during resize
 */
function injectIframeStyles(): HTMLStyleElement {
  const style = document.createElement('style');
  style.setAttribute('data-split-ui-iframe-fix', '');
  style.textContent = 'iframe { pointer-events: none !important; }';
  document.head.appendChild(style);
  return style;
}

/**
 * Removes the iframe style tag
 */
function removeIframeStyles(styleElement: HTMLStyleElement): void {
  styleElement.remove();
}

/**
 * Global drag state - only one resizer can be dragged at a time
 */
interface DragState {
  startPos: number;
  groupElement: HTMLElement;
  initialGroup: GroupState;
  resizerIndex: number;
  iframeStyleElement: HTMLStyleElement;
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
 * Checks if an element is in RTL mode
 */
function isRtlElement(elm: HTMLElement): boolean {
  return getComputedStyle(elm).direction === 'rtl';
}

/**
 * Inverts a numeric value if the element is in RTL mode
 */
function invertOnRtl(elm: HTMLElement, value: number): number {
  return isRtlElement(elm) ? -value : value;
}

/**
 * Gets the cursor value for a given orientation and constraint state
 */
function getDragCursor(
  orientation: 'horizontal' | 'vertical',
  isConstrained: 'min' | 'max' | null,
  isRtl: boolean,
): string {
  if (orientation === 'horizontal') {
    if (isConstrained === 'min') {
      return `var(--split-ui-cursor-horizontal-min, ${isRtl ? 'w-resize' : 'e-resize'})`;
    }
    if (isConstrained === 'max') {
      return `var(--split-ui-cursor-horizontal-max, ${isRtl ? 'e-resize' : 'w-resize'})`;
    }
    return 'var(--split-ui-cursor-horizontal, ew-resize)';
  } else {
    if (isConstrained === 'min') {
      return 'var(--split-ui-cursor-vertical-min, s-resize)';
    }
    if (isConstrained === 'max') {
      return 'var(--split-ui-cursor-vertical-max, n-resize)';
    }
    return 'var(--split-ui-cursor-vertical, ns-resize)';
  }
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
  if (!groupElm || !groupElm.dataset.groupId) {
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
 * Global observer for updating panel groups when they change
 */
let groupResizeObserver: ResizeObserver | null = null;

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
 * Creates a new ResizeObserver instance for panel groups
 */
function createResizeObserver(): ResizeObserver {
  if (typeof window === 'undefined') {
    throw new Error('ResizeObserver is only available in browser environments');
  }

  return new ResizeObserver((entries) => {
    entries.forEach((entry) => {
      handleGroupElmChanges(entry.target as HTMLElement);
    });
  });
}

/**
 * Gets or creates the global ResizeObserver instance
 */
function getGroupResizeObserver(): ResizeObserver {
  groupResizeObserver ??= createResizeObserver();
  return groupResizeObserver;
}

/**
 * Creates a new MutationObserver instance for panel groups
 */
function createMutationObserver(): MutationObserver {
  return new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        handleGroupElmChanges(mutation.target as HTMLElement);
      }
    });
  });
}

/**
 * Subscribes a panel group element to both resize and child list changes
 * Returns an unsubscribe function
 */
export function subscribeGroupElmChanges(
  groupElement: HTMLDivElement,
): () => void {
  const resizeObserver = getGroupResizeObserver();
  const mutationObserver = createMutationObserver();

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
        calculatePanelCapacity(leftPanels, 'collapse'), // how much left can shrink
        calculatePanelCapacity(rightPanels, 'expand'), // how much right can expand
      );

      const rightwardMovement = Math.min(
        calculatePanelCapacity(leftPanels, 'expand'), // how much left can expand
        calculatePanelCapacity(rightPanels, 'collapse'), // how much right can shrink
      );

      // Current resizer position is at the end of this panel
      currentPosition = currentPosition + panel.size;

      panelLayouts[panel.childId] = {
        // Panel width
        percentage,
        flex: panel.flex,
        // Resizer bounds
        ariaMin: Math.round(currentPosition - leftwardMovement),
        ariaMax: Math.round(currentPosition + rightwardMovement),
        ariaNow: Math.round(currentPosition),
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
  const collapseCapacity = calculatePanelCapacity(collapsePanels, 'collapse');
  const expansionCapacity = calculatePanelCapacity(expandPanels, 'expand');
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
 * Calculates panel capacity for a given operation
 */
function calculatePanelCapacity(
  panels: PanelsState,
  operation: 'collapse' | 'expand',
): number {
  let capacity = 0;

  for (const panel of panels) {
    if (panel.kind === 'panel') {
      capacity +=
        operation === 'collapse'
          ? Math.max(0, panel.size - panel.minSize) // How much can this panel shrink?
          : Math.max(0, panel.maxSize - panel.size); // How much can this panel grow?
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
 * Gets the size of an element based on orientation
 */
function getElementSize(element: HTMLElement, isVertical: boolean): number {
  return isVertical ? element.offsetHeight : element.offsetWidth;
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
    const childId = htmlChild.dataset.childId;
    if (htmlChild.classList.contains(CLASS_RESIZER)) {
      // This is a resizer
      const size = getElementSize(htmlChild, isVertical);
      layout.push({
        kind: 'resizer',
        elm: htmlChild,
        size,
      });
    } else if (childId) {
      const size = getElementSize(htmlChild, isVertical);
      const childStyle = getComputedStyle(htmlChild);

      const intrinsicMinSizeValue = isVertical
        ? parseFloat(childStyle.borderTopWidth) +
          parseFloat(childStyle.borderBottomWidth) +
          parseFloat(childStyle.paddingTop) +
          parseFloat(childStyle.paddingBottom)
        : parseFloat(childStyle.borderLeftWidth) +
          parseFloat(childStyle.borderRightWidth) +
          parseFloat(childStyle.paddingLeft) +
          parseFloat(childStyle.paddingRight);

      // Extract constraints from CSS
      const minSizeValue = isVertical
        ? childStyle.minHeight
        : childStyle.minWidth;
      const maxSizeValue = isVertical
        ? childStyle.maxHeight
        : childStyle.maxWidth;

      const parentSize = getElementSize(groupElm, isVertical);

      const minSize = Math.max(
        intrinsicMinSizeValue,
        getPixelWidth(minSizeValue, parentSize),
      );

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
  const containerSize = getElementSize(groupElm, isVertical);

  return {
    id: groupId,
    elm: groupElm,
    panels: layout,
    size: containerSize,
    orientation: isVertical ? 'vertical' : 'horizontal',
  };
}

/**
 * Finds an adjacent panel element using a traversal function
 */
function findAdjacentPanel(
  resizer: Element,
  getAdjacent: (elm: Element) => Element | null,
): Element | null {
  let current = getAdjacent(resizer);

  while (current) {
    const htmlCurrent = current as HTMLElement;
    if (current.classList.contains(CLASS_RESIZER)) {
      return null;
    } else if (htmlCurrent.dataset.childId) {
      return current;
    }
    current = getAdjacent(current);
  }

  return null;
}

const PREVIOUS = (elm: Element) => elm.previousElementSibling;
const NEXT = (elm: Element) => elm.nextElementSibling;

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

    const precedingPanel = findAdjacentPanel(resizer, PREVIOUS);
    const followingPanel = findAdjacentPanel(resizer, NEXT);

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

    // Optimize aria-controls attribute generation using attributeListValues
    const controls = attributeListValues(
      precedingPanel?.id,
      followingPanel?.id,
    );
    resizer.setAttribute('aria-controls', controls);
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

  // Update cursor based on constraint state
  const isRtl = isRtlElement(currentDragState.groupElement);
  document.body.style.cursor = getDragCursor(
    currentDragState.initialGroup.orientation,
    newLayout.isConstrained,
    isRtl,
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

  // Remove iframe style tag
  removeIframeStyles(currentDragState.iframeStyleElement);

  // Cleanup - clear global drag state
  currentDragState = null;

  // Clear inline body styles
  document.body.style.userSelect = '';
  document.body.style.touchAction = '';
  document.body.style.cursor = '';
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

  // Inject style to disable iframe pointer events
  const iframeStyleElement = injectIframeStyles();

  // Create global drag state
  currentDragState = {
    startPos: getEventPosition(event, groupState.orientation),
    groupElement: group,
    initialGroup: groupState,
    resizerIndex: clickedResizerIndex,
    iframeStyleElement,
  };

  document.addEventListener('pointermove', handlePointerMove);
  document.addEventListener('pointerup', handlePointerUp);

  // Set inline body styles for drag state
  document.body.style.userSelect = 'none';
  document.body.style.touchAction = 'none';
  const isRtl = isRtlElement(group);
  document.body.style.cursor = getDragCursor(
    groupState.orientation,
    null,
    isRtl,
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
