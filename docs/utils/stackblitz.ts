import sdk from '@stackblitz/sdk';

export interface StackBlitzProjectOptions {
  files: Record<string, string>;
  title?: string;
  description?: string;
}

export function openStackBlitzProject({
  files,
  title = 'split-ui Demo',
  description = 'Demo from split-ui documentation',
}: StackBlitzProjectOptions) {
  // Merge user files with default project structure
  const defaultFiles: Record<string, string> = {
    'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>split-ui Demo</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
    'package.json': JSON.stringify(
      {
        name: 'split-ui-demo',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'tsc && vite build',
          preview: 'vite preview',
        },
        dependencies: {
          react: '19',
          'react-dom': '19',
          '@split-ui/react': process.env.PREVIEW_PACKAGE_VERSION,
        },
        devDependencies: {
          '@types/react': '19',
          '@types/react-dom': '19',
          '@vitejs/plugin-react': '4',
          typescript: '5',
          vite: '7',
        },
      },
      null,
      2,
    ),
    'src/main.tsx': `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@split-ui/react/styles.css'
import App from './index.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)`,
    'vite.config.ts': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`,
  };

  const mergedFiles = { ...defaultFiles, ...files };

  sdk.openProject(
    {
      files: mergedFiles,
      title,
      description,
      template: 'node',
    },
    {
      newWindow: true,
    },
  );
}
