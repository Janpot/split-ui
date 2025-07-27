# React Flex Panels

A React component library for creating resizable panel layouts with flexible sizing options and SSR support.

[![Bundle Js react-flex-panels](https://deno.bundlejs.com/badge?q=react-flex-panels)](https://bundlejs.com/?q=react-flex-panels)

## Features

- 🎯 **Flexible Sizing**: Fixed sizes, percentages, CSS variables, and CSS calc() support
- 🖱️ **Multi-Input Support**: Mouse, keyboard, and touch interactions
- 🌐 **SSR Ready**: Built-in server-side rendering support
- 💾 **Persistence**: Automatic layout state preservation
- 🎨 **CSS Variables**: Theme and style integration
- ♿ **Accessible**: Keyboard navigation and ARIA support
- 📱 **Mobile Friendly**: Touch gesture support

## Monorepo Structure

This is a pnpm workspace monorepo containing:

```
├── packages/
│   └── react-flex-panels/     # Main library package
├── docs/                      # Next.js documentation site
├── prettier.config.ts         # Shared prettier configuration
├── eslint.config.js          # Shared ESLint configuration
└── pnpm-workspace.yaml       # Workspace configuration
```

## Quick Start

### Installation

```bash
npm install react-flex-panels
# or
pnpm add react-flex-panels
```

### Basic Usage

```tsx
import { Panel, Resizer } from "react-flex-panels";
import "react-flex-panels/styles.css";

function App() {
  return (
    <Panel group direction="row" style={{ height: "100vh" }}>
      <Panel initialSize="200px">Sidebar</Panel>
      <Resizer />
      <Panel>Main Content</Panel>
      <Resizer />
      <Panel initialSize="25%">Right Panel</Panel>
    </Panel>
  );
}
```

## Development

### Prerequisites

- Node.js 18+
- pnpm 8+

### Setup

```bash
# Clone the repository
git clone https://github.com/Janpot/react-flex-panels.git
cd react-flex-panels

# Install dependencies
pnpm install

# Start development servers (library + docs)
pnpm dev
```

### Available Scripts

| Command           | Description                                |
| ----------------- | ------------------------------------------ |
| `pnpm dev`        | Start development servers for all packages |
| `pnpm build`      | Build all packages                         |
| `pnpm start`      | Start the documentation site               |
| `pnpm lint`       | Lint all packages                          |
| `pnpm format`     | Format code with Prettier                  |
| `pnpm typescript` | Type check all packages                    |
| `pnpm release`    | Build and publish packages                 |

### Package Scripts

#### Library (`packages/react-flex-panels/`)

```bash
cd packages/react-flex-panels
pnpm build        # Build the library
pnpm dev          # Build in watch mode
pnpm typescript   # Type check
```

#### Documentation (`docs/`)

```bash
cd docs
pnpm dev          # Start Next.js dev server
pnpm build        # Build for production
pnpm start        # Start production server
```

## Architecture

### Library Structure

- **`Panel`**: The main container component that can be a group or individual panel
- **`Resizer`**: Interactive element for resizing adjacent panels
- **Layout System**: DOM-based size calculation and CSS variable integration
- **Store**: Persistence layer for saving/restoring panel states

### Key Features

1. **CSS-First Approach**: Initial layouts can be fully handled by CSS
2. **DOM-Based Calculations**: Sizes are extracted from actual DOM elements
3. **SSR Compatible**: Uses CSS variables for seamless server-side rendering
4. **Touch Optimized**: Prevents scrolling during resize operations

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`pnpm lint && pnpm typescript`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style

This project uses:

- **Prettier** for code formatting
- **ESLint** for code quality
- **TypeScript** for type safety

Run `pnpm format` before committing to ensure consistent formatting.

## Documentation

Visit the [documentation site](https://react-flex-panels.vercel.app) for:

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
