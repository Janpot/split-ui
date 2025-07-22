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
  initialSize?: string;
  minSize?: string;
  maxSize?: string;
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
  persistenceId,
  ...props
}) => {
  const genId = useId();
  const id = createPanelId(persistenceId || genId, !!persistenceId);

  const storePanelInfo = React.useSyncExternalStore(
    getSubscribe(id),
    getGetSnapshot(id),
    getServerSnapshot,
  );

  const groupStyle: React.CSSProperties &
    Record<`--${string}`, number | string> = {
    ...style,
  };

  const flexValue = initialSize === undefined ? 1 : getFlexValue(initialSize);
  groupStyle["--rfp-flex"] = storePanelInfo?.flexValue ?? flexValue;

  if (group) {
    groupStyle.flexDirection = direction;
  }

  groupStyle["--rfp-min-size"] = minSize ?? "0";

  groupStyle["--rfp-max-size"] = maxSize ?? "auto";

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

  return (
    <div
      className={classes}
      style={groupStyle}
      data-panel-id={id}
      suppressHydrationWarning={!!persistenceId}
      {...props}
    >
      {children}
      {group ? (
        <script dangerouslySetInnerHTML={{ __html: getHydrateScript() }} />
      ) : null}
    </div>
  );
};
