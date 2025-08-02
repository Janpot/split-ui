# React Flex Panels

A React component library for creating resizable panel layouts with flexible sizing options and SSR support.

[![Bundle Js react-flex-panels](https://deno.bundlejs.com/badge?q=react-flex-panels)](https://bundlejs.com/?q=react-flex-panels)

- [documentation](https://react-flex-panels-docs.vercel.app/)

## Quick Start

### Installation

```bash
npm install react-flex-panels
# or
pnpm add react-flex-panels
```

### Basic Usage

```tsx
import { Panel, Resizer } from 'react-flex-panels';
import 'react-flex-panels/styles.css';

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

- [npm package](https://www.npmjs.com/package/react-flex-panels)
- [GitHub repository](https://github.com/Janpot/react-flex-panels)
- [Documentation](https://react-flex-panels.vercel.app)
- [Bundle size analysis](https://bundlejs.com/?q=react-flex-panels)
