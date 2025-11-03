import * as React from 'react';
import { handleKeyDown, handlePointerDown } from './core';
import { GroupContext } from './GroupContext';
import { CLASS_RESIZER } from './constants';

/**
 * Props for the Resizer component.
 */
export interface ResizerProps {
  /**
   * Additional CSS class names to apply to the resizer element.
   */
  className?: string;

  /**
   * Inline styles to apply to the resizer element.
   */
  style?: React.CSSProperties;

  /**
   * Content to render inside the resizer.
   * Useful for adding custom drag handles or visual indicators.
   */
  children?: React.ReactNode;
}

/**
 * A resizer component that allows users to adjust the size of adjacent panels.
 *
 * Must be placed between Panel components within a Panel group to enable resizing.
 * Supports mouse, touch, and keyboard interaction for accessibility.
 *
 * @example Basic resizer
 * ```tsx
 * <Panel group>
 *   <Panel>Left Panel</Panel>
 *   <Resizer />
 *   <Panel>Right Panel</Panel>
 * </Panel>
 * ```
 */
export const Resizer: React.FC<ResizerProps> = ({
  className = '',
  style = {},
  ...props
}) => {
  const group = React.useContext(GroupContext);
  // Optimize className generation to avoid array operations
  const classes = className ? `${CLASS_RESIZER} ${className}` : CLASS_RESIZER;

  return (
    <div
      className={classes}
      style={style}
      tabIndex={0}
      role="separator"
      aria-orientation={group?.orientation}
      aria-label="Resize panels"
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
};
