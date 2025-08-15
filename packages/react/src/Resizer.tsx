import * as React from 'react';
import { handleKeyDown, handleMouseDown, handleTouchStart } from './core';
import { GroupContext } from './GroupContext';
import { CLASS_RESIZER } from './constants';

export interface ResizerProps {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const Resizer: React.FC<ResizerProps> = ({
  className = '',
  style = {},
  ...props
}) => {
  const group = React.useContext(GroupContext);
  const classes = [CLASS_RESIZER, className].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      style={style}
      tabIndex={0}
      role="separator"
      aria-orientation={group?.orientation}
      aria-label="Resize panels"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
};
