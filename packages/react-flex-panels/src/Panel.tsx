import React, { useId } from "react";
import {
  createPanelId,
  getGetSnapshot,
  HYDRATE_SCRIPT,
  getServerSnapshot,
  getSubscribe,
} from "./store";

export interface GroupContextType {
  getNextChildId: () => string;
}

const GroupContext = React.createContext<GroupContextType | null>(null);

export interface PanelProps {
  children?: React.ReactNode;
  persistenceId?: string;
  className?: string;
  style?: React.CSSProperties;
  group?: boolean;
  direction?: "row" | "column" | "row-reverse" | "column-reverse";
  initialSize?: string;
  minSize?: string;
  maxSize?: string;
  collapseSize?: string;
}

function getFlexValue(size: string): string {
  return `0 0 ${size}`;
}

export const Panel: React.FC<PanelProps> = ({
  children,
  className = "",
  style = {},
  group = false,
  direction = "row",
  initialSize,
  minSize,
  maxSize,
  collapseSize,
  persistenceId,
  ...props
}) => {
  const genId = useId();
  const groupId = createPanelId(persistenceId || genId, !!persistenceId);

  const parent = React.useContext(GroupContext);

  const storeGroupInfo = React.useSyncExternalStore(
    getSubscribe(groupId),
    getGetSnapshot(groupId),
    getServerSnapshot
  );

  const initialFlexValue =
    initialSize === undefined ? 1 : getFlexValue(initialSize);

  const panelStyles: React.CSSProperties &
    Record<`--${string}`, number | string | undefined> = {
    ...style,
  };

  if (group) {
    panelStyles.flexDirection = direction;
    if (storeGroupInfo) {
      for (const [order, flexValue] of Object.entries(
        storeGroupInfo.flexValues
      )) {
        panelStyles[`--rfp-flex-${order}`] = flexValue;
      }
    }
  }

  let childId: string | null = null;

  if (parent) {
    childId = parent.getNextChildId();
    const varableName = `--rfp-flex-${childId}`;
    panelStyles["--rfp-flex"] = `var(${varableName}, ${initialFlexValue})`;

    panelStyles["--rfp-min-size"] = minSize ?? "0";

    panelStyles["--rfp-max-size"] = maxSize ?? "auto";
  }

  const orientation =
    direction === "column" || direction === "column-reverse"
      ? "vertical"
      : "horizontal";

  const classes = [
    "rfp-panel",
    group && "rfp-panel-group",
    group && `rfp-${orientation}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const measurementStyle: React.CSSProperties &
    Record<`--${string}`, number | string> = {
    "--rfp-collapse-size": collapseSize ?? "0",
  };

  const nextPanelId = React.useRef(1);
  nextPanelId.current = 1;
  const contextValue: GroupContextType | null = React.useMemo(() => {
    if (!group) {
      return null;
    }

    const escapedGroupId = groupId.replace(":", "-");
    return {
      getNextChildId: () => {
        const currentId = nextPanelId.current;
        nextPanelId.current += 1;
        return `${escapedGroupId}-${currentId}`;
      },
    };
  }, [group, groupId]);

  return (
    <GroupContext.Provider value={contextValue}>
      <div
        className={classes}
        style={panelStyles}
        data-group-id={groupId}
        data-child-id={childId}
        suppressHydrationWarning
        {...props}
      >
        <script
          dangerouslySetInnerHTML={{ __html: group ? HYDRATE_SCRIPT : "" }}
        />
        {children}
        <div />
      </div>
      <div className="rfp-collapse-measure" style={measurementStyle} />
    </GroupContext.Provider>
  );
};
