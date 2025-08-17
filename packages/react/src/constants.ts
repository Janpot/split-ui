import { CSSPropertyName } from './types';

// CSS Classes
export const CLASS_PANEL = 'split-ui-panel';
export const CLASS_PANEL_GROUP = 'split-ui-panel-group';
export const CLASS_RESIZER = 'split-ui-resizer';
export const CLASS_VERTICAL = 'split-ui-vertical';
export const CLASS_HORIZONTAL = 'split-ui-horizontal';
export const CLASS_RESIZING = 'split-ui-resizing';
export const CLASS_CONSTRAINED_MIN = 'split-ui-constrained-min';
export const CLASS_CONSTRAINED_MAX = 'split-ui-constrained-max';

// CSS Custom Properties
export const CSS_PROP_FLEX = '--split-ui-flex';
export const CSS_PROP_MIN_SIZE = '--split-ui-min-size';
export const CSS_PROP_MAX_SIZE = '--split-ui-max-size';

// Dynamic property function
export const CSS_PROP_CHILD_FLEX_PREFIX = '--split-ui-flex-';
export const CSS_PROP_CHILD_FLEX = (childId: string): CSSPropertyName =>
  `${CSS_PROP_CHILD_FLEX_PREFIX}${childId}`;

// Storage
export const LOCAL_STORAGE_PREFIX = '--split-ui-';
