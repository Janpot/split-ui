import * as React from 'react';
import { handleKeyDown, handleMouseDown, handleTouchStart } from './core';
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
  const classes = [CLASS_RESIZER, className].filter(Boolean).join(' ');
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const elm = ref.current!;
    elm.addEventListener('touchstart', handleTouchStart, {
      passive: false,
    });
    return () => {
      elm.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={classes}
      style={style}
      tabIndex={0}
      role="separator"
      aria-orientation={group?.orientation}
      aria-label="Resize panels"
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
};
