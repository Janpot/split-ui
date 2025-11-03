import * as React from 'react';
import {
  createPanelId,
  HYDRATE_SCRIPT,
  subscribe,
  getSnapshot,
  StorePanelInfo,
} from './store';
import { GroupContext, GroupContextType } from './GroupContext';
import { subscribeGroupElmChanges } from './core';
import {
  CLASS_PANEL,
  CLASS_PANEL_GROUP,
  CLASS_VERTICAL,
  CLASS_HORIZONTAL,
  CSS_PROP_FLEX,
  CSS_PROP_MIN_SIZE,
  CSS_PROP_MAX_SIZE,
  CSS_PROP_CHILD_FLEX,
} from './constants';
import { CSSPropertyName } from './types';
import { attributeListValues } from './utils';

/**
 * Props for the Panel component.
 */
export interface PanelProps {
  /**
   * Content to render inside the panel.
   */
  children?: React.ReactNode;

  /**
   * Unique identifier for persisting panel sizes across browser sessions.
   * When provided, panel sizes are automatically saved to localStorage and restored on page load.
   * Use the same persistenceId across multiple panel groups to sync their layouts.
   *
   * @example
   * ```tsx
   * <Panel group persistenceId="main-layout">
   *   <Panel>Sidebar</Panel>
   *   <Resizer />
   *   <Panel>Content</Panel>
   * </Panel>
   * ```
   */
  persistenceId?: string;

  /**
   * Additional CSS class names to apply to the panel element.
   */
  className?: string;

  /**
   * Inline styles to apply to the panel element.
   */
  style?: React.CSSProperties;

  /**
   * Whether this panel acts as a container for other panels and resizers.
   * When true, the panel becomes a flex container that can hold child panels and resizers.
   *
   * @default false
   */
  group?: boolean;

  /**
   * Layout orientation for panel groups.
   * - `'horizontal'`: Panels are arranged left-to-right (default)
   * - `'vertical'`: Panels are arranged top-to-bottom
   *
   * Only applies when `group` is true.
   *
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';

  /**
   * Initial size of the panel. Accepts any valid CSS size value.
   * When provided, the panel has a fixed initial size and won't automatically grow/shrink.
   * When omitted, the panel will automatically fill available space.
   *
   * @example
   * ```tsx
   * // Fixed pixel size
   * <Panel initialSize="300px">
   *
   * // Percentage of parent
   * <Panel initialSize="25%">
   *
   * // CSS calc() expressions
   * <Panel initialSize="calc(100vh - 200px)">
   *
   * // CSS custom properties
   * <Panel initialSize="var(--sidebar-width)">
   * ```
   */
  initialSize?: string;

  /**
   * Minimum size constraint for the panel. Accepts any valid CSS size value.
   * Prevents the panel from being resized smaller than this value.
   *
   * @default '0'
   */
  minSize?: string;

  /**
   * Maximum size constraint for the panel. Accepts any valid CSS size value.
   * Prevents the panel from being resized larger than this value.
   *
   * @default 'auto' (no maximum)
   */
  maxSize?: string;

  /**
   * Unique identifier for the panel within its parent group.
   * Used for persistence and conditional rendering scenarios.
   * If not provided, an auto-generated index will be used.
   *
   * @example
   * ```tsx
   * <Panel group>
   *   <Panel index="sidebar">Sidebar</Panel>
   *   <Resizer />
   *   {showPanel && <Panel index="optional">Optional Panel</Panel>}
   * </Panel>
   * ```
   */
  index?: string;
}

function getFlexValue(size: string): string {
  return `0 0 ${size}`;
}

function getServerSnapshot(): StorePanelInfo | undefined {
  return undefined;
}

/**
 * A flexible panel component for creating resizable layouts.
 *
 * Panels can act as containers (when `group` is true) or as content areas.
 * Container panels hold child panels and resizers to create complex layouts.
 * Content panels hold your application content and can be resized by adjacent resizers.
 *
 * @example Basic horizontal layout
 * ```tsx
 * <Panel group orientation="horizontal">
 *   <Panel initialSize="200px">Sidebar</Panel>
 *   <Resizer />
 *   <Panel>Main Content</Panel>
 * </Panel>
 * ```
 */
export const Panel: React.FC<PanelProps> = ({
  children,
  className = '',
  style = {},
  group = false,
  orientation = 'horizontal',
  initialSize,
  minSize,
  maxSize,
  persistenceId,
  index,
  ...props
}) => {
  const genId = React.useId();
  const isPersistent = !!persistenceId;
  const groupId = createPanelId(persistenceId || genId, isPersistent);

  const parent = React.useContext(GroupContext);

  const subscribePanel = React.useCallback(
    (cb: () => void) => subscribe(groupId, cb),
    [groupId],
  );

  const getPanelSnapshot = React.useCallback(
    () => getSnapshot(groupId),
    [groupId],
  );

  const storeGroupInfo = React.useSyncExternalStore(
    subscribePanel,
    getPanelSnapshot,
    getServerSnapshot,
  );

  const isFlexPanel = initialSize === undefined;
  const initialFlexValue =
    initialSize === undefined ? 1 : getFlexValue(initialSize);

  const panelStyles: React.CSSProperties &
    Record<CSSPropertyName, number | string | undefined> = {
    ...style,
  };

  if (group) {
    panelStyles.flexDirection = orientation === 'vertical' ? 'column' : 'row';
    if (storeGroupInfo) {
      for (const [order, flexValue] of Object.entries(
        storeGroupInfo.flexValues,
      )) {
        panelStyles[CSS_PROP_CHILD_FLEX(order)] = flexValue;
      }
    }
  }

  const childId = React.useRef<string | undefined>(undefined);

  if (parent) {
    childId.current ??= parent.getNextChildId(index);

    const varableName = CSS_PROP_CHILD_FLEX(childId.current);
    panelStyles[CSS_PROP_FLEX] = `var(${varableName}, ${initialFlexValue})`;

    panelStyles[CSS_PROP_MIN_SIZE] = minSize ?? '0';

    panelStyles[CSS_PROP_MAX_SIZE] = maxSize ?? 'auto';
  }

  const classes = attributeListValues(
    CLASS_PANEL,
    group && CLASS_PANEL_GROUP,
    group && (orientation === 'vertical' ? CLASS_VERTICAL : CLASS_HORIZONTAL),
    className,
  );

  const nextPanelIdSeq = React.useRef<number>(1);
  const frozen = React.useRef(false);

  React.useEffect(() => {
    frozen.current = true;
  }, []);

  const getNextChildId = React.useCallback(
    (suffix: string | undefined): string => {
      if (suffix === undefined) {
        if (process.env.NODE_ENV !== 'production' && frozen.current) {
          console.warn(
            `Conditional panel detected after initial render. This may cause issues. Always provide a \`index\` prop to conditional panels.\n${React.captureOwnerStack()}`,
          );
        }
        suffix = String(nextPanelIdSeq.current);
        nextPanelIdSeq.current += 1;
      }

      return `${groupId.replace(':', '-')}-${suffix}`;
    },
    [groupId],
  );

  const contextValue: GroupContextType | null = React.useMemo(
    () => (group ? { orientation, getNextChildId } : null),
    [getNextChildId, group, orientation],
  );

  return (
    <div
      ref={group ? subscribeGroupElmChanges : undefined}
      className={classes}
      style={panelStyles}
      data-group-id={groupId}
      data-child-id={childId.current}
      data-flex={isFlexPanel}
      data-dirty={!!storeGroupInfo}
      id={childId.current}
      suppressHydrationWarning={isPersistent}
      {...props}
    >
      <script
        dangerouslySetInnerHTML={{ __html: group ? HYDRATE_SCRIPT : '' }}
      />
      <GroupContext.Provider value={contextValue}>
        {children}
      </GroupContext.Provider>
    </div>
  );
};
