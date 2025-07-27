import "@/styles/globals.css";
import "react-flex-panels/styles.css";
import "./layout.css";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | React Flex Panels",
    default: "React Flex Panels",
  },
  description: "A React component library for creating resizable panel layouts with flexible sizing options and SSR support.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <div className="nav-container">
            <div className="nav-links">
              <Link href="/" className="nav-brand">
                React Flex Panels
              </Link>
              <Link href="/resizable" className="nav-link">
                Resizable
              </Link>
              <Link href="/custom-resizer" className="nav-link">
                Custom Resizer
              </Link>
              <Link href="/nested" className="nav-link">
                Nested
              </Link>
              <Link href="/persistence" className="nav-link">
                Persistence
              </Link>
              <Link href="/static" className="nav-link">
                Static Layouts
              </Link>
            </div>
            <a
              href="https://github.com/Janpot/react-flex-panels"
              className="nav-github"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </div>
        </nav>
        <main className="main">{children}</main>
      </body>
    </html>
  );
}
