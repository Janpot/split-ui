"use client";

import * as React from "react";
import sdk from "@stackblitz/sdk";
import "./CodeSection.css";

interface CodeSectionProps {
  tsCode: React.ReactNode;
  cssCode?: React.ReactNode;
  tsSource: string;
  cssSource?: string;
}

export function CodeSection({
  tsCode,
  cssCode,
  tsSource,
  cssSource,
}: CodeSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"tsx" | "css">("tsx");

  const handleTabClick = (tab: "tsx" | "css") => {
    setActiveTab(tab);
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  const handleStackBlitz = () => {
    const indexTsxContent = tsSource;
    const indexCssContent = cssSource || "";

    const files: Record<string, string> = {
      "index.html": `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React Flex Panels Demo</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      "package.json": JSON.stringify(
        {
          name: "react-flex-panels-demo",
          type: "module",
          scripts: {
            dev: "vite",
            build: "tsc && vite build",
            preview: "vite preview",
          },
          dependencies: {
            react: "19",
            "react-dom": "19",
            "react-flex-panels": process.env.PREVIEW_PACKAGE_VERSION,
          },
          devDependencies: {
            "@types/react": "19",
            "@types/react-dom": "19",
            "@vitejs/plugin-react": "4",
            typescript: "5",
            vite: "7",
          },
        },
        null,
        2,
      ),
      "src/main.tsx": `import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import 'react-flex-panels/styles.css'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)`,
      "src/App.tsx": indexTsxContent,
      "src/index.css": `${indexCssContent}

html,
body,
#root {
  margin: 0;
  width: 100%;
  height: 100%;
}`,
      "vite.config.ts": `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`,
    };

    sdk.openProject(
      {
        files,
        title: "React Flex Panels Demo",
        description: "Demo from React Flex Panels documentation",
        template: "node",
      },
      {
        newWindow: true,
      },
    );
  };

  return (
    <div className="code-section">
      <div className="code-header">
        <div className="tabs">
          <button
            className={`tab ${activeTab === "tsx" ? "active" : ""}`}
            onClick={() => handleTabClick("tsx")}
          >
            index.tsx
          </button>
          {cssCode && (
            <button
              className={`tab ${activeTab === "css" ? "active" : ""}`}
              onClick={() => handleTabClick("css")}
            >
              index.css
            </button>
          )}
        </div>
        <div className="toolbar">
          <button className="toolbar-btn" onClick={handleStackBlitz}>
            Open in StackBlitz
          </button>
        </div>
      </div>

      <div
        className={`code-container ${isExpanded ? "expanded" : "collapsed"}`}
        tabIndex={-1}
        onKeyDown={(event: React.KeyboardEvent) => {
          if (
            event.key === "a" &&
            (event.metaKey || event.ctrlKey) &&
            !event.shiftKey &&
            !event.altKey
          ) {
            event.preventDefault();
            window.getSelection()?.selectAllChildren(event.currentTarget);
          }
        }}
      >
        <div className="code-content">
          {activeTab === "tsx" ? tsCode : cssCode}
        </div>
      </div>
      <button
        className={`toggle-button ${isExpanded ? "expanded" : "collapsed"}`}
        onClick={() => setIsExpanded((current) => !current)}
      >
        <span>{isExpanded ? "Click to collapse" : "Click to expand"}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="currentColor"
          style={{
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          <path d="M6 8.5L2.5 5 3.5 4 6 6.5 8.5 4 9.5 5 6 8.5z" />
        </svg>
      </button>
    </div>
  );
}
