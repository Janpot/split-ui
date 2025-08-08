# split-ui

A React component library for creating resizable panel layouts with flexible sizing options and SSR support.

[![Bundle Js @split-ui/react](https://deno.bundlejs.com/badge?q=@split-ui/react)](https://bundlejs.com/?q=@split-ui/react)

- [documentation](https://react-flex-panels-docs.vercel.app/)

## Quick Start

### Installation

```bash
npm install @split-ui/react
# or
pnpm add @split-ui/react
```

### Basic Usage

```tsx
import { Panel, Resizer } from '@split-ui/react';
import '@split-ui/react/styles.css';

function App() {
  return (
    <Panel group direction="row" style={{ height: '100vh' }}>
      <Panel initialSize="200px">Sidebar</Panel>
      <Resizer />
      <Panel>Main Content</Panel>
      <Resizer />
      <Panel initialSize="25%">Right Panel</Panel>
    </Panel>
  );
}
```

## Documentation

- Interactive examples
- Complete API reference
- Implementation guides
- Comparison with other libraries

## License

MIT © [Jan Potoms](https://github.com/Janpot)

## Links

- [npm package](https://www.npmjs.com/package/@split-ui/react)
- [GitHub repository](https://github.com/Janpot/split-ui)
- [Documentation](https://react-flex-panels.vercel.app)
- [Bundle size analysis](https://bundlejs.com/?q=@split-ui/react)
