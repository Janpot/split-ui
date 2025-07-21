import "@/styles/globals.css";
import "react-flex-panels/styles.css";
import Link from "next/link";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav style={{ padding: "1rem", borderBottom: "1px solid #eee" }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <Link
              href="/"
              style={{ fontWeight: "bold", textDecoration: "none" }}
            >
              React Flex Panels
            </Link>
            <Link href="/resizable" style={{ textDecoration: "none" }}>
              Resizable
            </Link>
            <Link href="/custom-resizer" style={{ textDecoration: "none" }}>
              Custom Resizer
            </Link>
            <Link href="/nested" style={{ textDecoration: "none" }}>
              Nested
            </Link>
            <Link href="/persistence" style={{ textDecoration: "none" }}>
              Persistence
            </Link>
            <Link href="/static" style={{ textDecoration: "none" }}>
              Static Layouts
            </Link>
          </div>
        </nav>
        <main style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
