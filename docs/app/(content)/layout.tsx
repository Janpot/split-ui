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
  keywords: [
    'React',
    'component library',
    'resizable panels',
    'split panels',
    'layout',
    'UI components',
  ],
  authors: [{ name: 'Jan Potoms' }],
  creator: 'Jan Potoms',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://split-ui-docs.janpot.dev',
    siteName: 'Split UI',
    title: 'Split UI - React Resizable Panel Library',
    description:
      'A React component library for creating resizable panel layouts with flexible sizing options and SSR support.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Split UI - React Resizable Panel Library',
    description:
      'A React component library for creating resizable panel layouts with flexible sizing options and SSR support.',
  },
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
