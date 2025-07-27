import * as React from "react";

export interface GroupContextType {
  orientation: "horizontal" | "vertical";
  getNextChildId: () => string;
}

export const GroupContext = React.createContext<GroupContextType | null>(null);
