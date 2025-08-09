declare module '*?demo' {
  import * as React from 'react';

  const component: React.ComponentType;
  export default component;

  export const element: React.ReactElement;
  export const files: Map<string, string>;
}
