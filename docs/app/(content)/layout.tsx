import '@/styles/globals.css';
import '@split-ui/react/styles.css';
import styles from './layout.module.css';
import { Metadata } from 'next';
import ResponsiveNav from '@/components/ResponsiveNav';
import { SlugProvider } from '@/components/SlugContext';

export const metadata: Metadata = {
  title: {
    template: '%s | split-ui',
    default: 'split-ui',
  },
  description:
    'A React component library for creating resizable panel layouts with flexible sizing options and SSR support.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <div className={styles.layout}>
          <ResponsiveNav />
          <SlugProvider>
            <main className={styles.main}>{children}</main>
          </SlugProvider>
        </div>
      </body>
    </html>
  );
}
