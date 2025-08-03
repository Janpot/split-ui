import React from 'react';
import {
  createPanelId,
  getGetSnapshot,
  HYDRATE_SCRIPT,
  getServerSnapshot,
  getSubscribe,
} from './store';
import { GroupContext, GroupContextType } from './GroupContext';
import { subscribeGroupResize } from './layout';
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

export interface PanelProps {
  children?: React.ReactNode;
  persistenceId?: string;
  className?: string;
  style?: React.CSSProperties;
  group?: boolean;
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  initialSize?: string;
  minSize?: string;
  maxSize?: string;
  panelKey?: string;
}

function getFlexValue(size: string): string {
  return `0 0 ${size}`;
}

export const Panel: React.FC<PanelProps> = ({
  children,
  className = '',
  style = {},
  group = false,
  direction = 'row',
  initialSize,
  minSize,
  maxSize,
  persistenceId,
  panelKey,
  ...props
}) => {
  const genId = React.useId();
  const isPersistent = !!persistenceId;
  const groupId = createPanelId(persistenceId || genId, isPersistent);

  const parent = React.useContext(GroupContext);

  const storeGroupInfo = React.useSyncExternalStore(
    getSubscribe(groupId),
    getGetSnapshot(groupId),
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
    panelStyles.flexDirection = direction;
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
    childId.current ??= parent.getNextChildId(panelKey);

    const varableName = CSS_PROP_CHILD_FLEX(childId.current);
    panelStyles[CSS_PROP_FLEX] = `var(${varableName}, ${initialFlexValue})`;

    panelStyles[CSS_PROP_MIN_SIZE] = minSize ?? '0';

    panelStyles[CSS_PROP_MAX_SIZE] = maxSize ?? 'auto';
  }

  const orientation =
    direction === 'column' || direction === 'column-reverse'
      ? 'vertical'
      : 'horizontal';

  const classes = [
    CLASS_PANEL,
    group && CLASS_PANEL_GROUP,
    group && (orientation === 'vertical' ? CLASS_VERTICAL : CLASS_HORIZONTAL),
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const nextPanelIdSeq = React.useRef<number>(1);
  const frozen = React.useRef(false);

  React.useEffect(() => {
    frozen.current = true;
  }, []);

  const getNextChildId = React.useCallback(
    (suffix: string | undefined): string => {
      if (suffix === undefined) {
        if (frozen.current) {
          console.warn(
            `Conditional panel detected after initial render. This may cause issues. Always provide  a \`key\` prop to conditional panels.`,
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
      ref={group ? subscribeGroupResize : undefined}
      className={classes}
      style={panelStyles}
      data-group-id={groupId}
      data-child-id={childId.current}
      data-flex={isFlexPanel}
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
