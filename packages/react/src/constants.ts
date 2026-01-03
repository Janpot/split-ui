import { CSSPropertyName } from './types';

// CSS Classes (only those with associated CSS styles)
export const CLASS_RESIZER = 'split-ui-resizer';

// CSS Custom Properties
export const CSS_PROP_FLEX = '--split-ui-flex';

// Dynamic property function
export const CSS_PROP_CHILD_FLEX_PREFIX = '--split-ui-flex-';
export const CSS_PROP_CHILD_FLEX = (childId: string): CSSPropertyName =>
  `${CSS_PROP_CHILD_FLEX_PREFIX}${childId}`;

// Storage
export const LOCAL_STORAGE_PREFIX = '--split-ui-';
