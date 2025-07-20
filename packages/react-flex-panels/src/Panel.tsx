import React, { useId } from "react";
import {
  createPanelId,
  getGetSnapshot,
  getHydrateScript,
  getServerSnapshot,
  getSubscribe,
} from "./store";

export interface PanelProps {
  children?: React.ReactNode;
  persistenceId?: string;
  className?: string;
  style?: React.CSSProperties;
  group?: boolean;
  direction?: "row" | "column" | "row-reverse" | "column-reverse";
  size?: string;
  minSize?: string;
  maxSize?: string;
  flex?: number;
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
  size,
  minSize,
  maxSize,
  flex = 1,
  persistenceId,
  ...props
}) => {
  const genId = useId();
  const id = createPanelId(persistenceId || genId, !!persistenceId);

  const storePanelInfo = React.useSyncExternalStore(
    getSubscribe(id),
    getGetSnapshot(id),
    getServerSnapshot
  );

  const groupStyle: React.CSSProperties &
    Record<`--${string}`, number | string> = {
    ...style,
  };

  const flexValue = size === undefined ? flex : getFlexValue(size);
  groupStyle["--rfp-flex"] = storePanelInfo?.flexValue ?? flexValue;

  if (group) {
    groupStyle.flexDirection = direction;
  }

  if (minSize) {
    groupStyle["--rfp-min-size"] = minSize;
  }

  if (maxSize) {
    groupStyle["--rfp-max-size"] = maxSize;
  }

  const classes = [
    "rfp-panel",
    group && "rfp-panel-group",
    group && `rfp-${direction}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div
        className={classes}
        style={groupStyle}
        data-panel-id={id}
        suppressHydrationWarning
        {...props}
      >
        {children}
      </div>
      <script dangerouslySetInnerHTML={{ __html: getHydrateScript(id) }} />
    </>
  );
};
