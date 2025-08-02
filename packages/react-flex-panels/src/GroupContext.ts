import * as React from 'react';

export interface GroupContextType {
  orientation: 'horizontal' | 'vertical';
  getNextChildId: (panelKey: string | undefined) => string;
}

export const GroupContext = React.createContext<GroupContextType | null>(null);
