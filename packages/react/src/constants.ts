import { CSSPropertyName } from './types';

// CSS Classes
export const CLASS_PANEL = 'rfp-panel';
export const CLASS_PANEL_GROUP = 'rfp-panel-group';
export const CLASS_RESIZER = 'rfp-resizer';
export const CLASS_VERTICAL = 'rfp-vertical';
export const CLASS_HORIZONTAL = 'rfp-horizontal';
export const CLASS_RESIZING = 'rfp-resizing';
export const CLASS_CONSTRAINED_MIN = 'rfp-constrained-min';
export const CLASS_CONSTRAINED_MAX = 'rfp-constrained-max';

// CSS Custom Properties
export const CSS_PROP_FLEX = '--rfp-flex';
export const CSS_PROP_MIN_SIZE = '--rfp-min-size';
export const CSS_PROP_MAX_SIZE = '--rfp-max-size';

// Dynamic property function
export const CSS_PROP_CHILD_FLEX_PREFIX = '--rfp-flex-';
export const CSS_PROP_CHILD_FLEX = (childId: string): CSSPropertyName =>
  `${CSS_PROP_CHILD_FLEX_PREFIX}${childId}`;

// Storage
export const LOCAL_STORAGE_PREFIX = '--rfp-';
