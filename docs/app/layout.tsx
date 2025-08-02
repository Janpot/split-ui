import '@/styles/globals.css';
import 'react-flex-panels/styles.css';
import './layout.css';
import { Metadata } from 'next';
import ResponsiveNav from '@/components/ResponsiveNav';
import { SlugProvider } from '@/components/SlugContext';

export const metadata: Metadata = {
  title: {
    template: '%s | React Flex Panels',
    default: 'React Flex Panels',
  },
  description:
    'A React component library for creating resizable panel layouts with flexible sizing options and SSR support.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <div className="layout">
          <ResponsiveNav />
          <SlugProvider>
            <main className="main">{children}</main>
          </SlugProvider>
        </div>
      </body>
    </html>
  );
}
