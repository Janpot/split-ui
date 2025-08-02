# react-flex-panels

A flexible and lightweight React component library for creating resizable panel layouts.

## Features

- 🎯 **Simple API** - Just two components: `Panel`, and `Resizer`
- 🎨 **Customizable** - Full control over styling and layout
- 💾 **Persistence** - Save and restore panel sizes with SSR support
- 🏗️ **Nestable** - Create complex nested layouts
- ⚡ **Lightweight** - Minimal bundle size with zero dependencies

## Installation

```bash
npm install react-flex-panels
```

## Quick Start

```tsx
import { Panel, Resizer } from 'react-flex-panels';
import 'react-flex-panels/styles.css';

function App() {
  return (
    <Panel group>
      <Panel initialSize={300}>
        <h2>Sidebar</h2>
        <p>This panel has a fixed initial size</p>
      </Panel>
      <Resizer />
      <Panel>
        <h2>Main Content</h2>
        <p>This panel takes up the remaining space</p>
      </Panel>
    </Panel>
  );
}
```

## Documentation

For complete documentation, examples, and advanced usage patterns, visit:

**[https://react-flex-panels-docs.vercel.app/](https://react-flex-panels-docs.vercel.app/)**

## License

MIT
