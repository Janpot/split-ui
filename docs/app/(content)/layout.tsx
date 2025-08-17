import '@/styles/globals.css';
import '@split-ui/react/styles.css';
import styles from './layout.module.css';
import { Metadata } from 'next';
import ResponsiveNav from '@/components/ResponsiveNav';
import { SlugProvider } from '@/components/SlugContext';

const SITE_URL = 'https://split-ui-docs.vercel.app';
const SITE_NAME = 'Split UI';
const SITE_TITLE = 'React Resizable Panel Library';
const SITE_DESCRIPTION =
  'A React component library for creating resizable panel layouts with flexible sizing options and SSR support.';

export const metadata: Metadata = {
  title: {
    template: `%s | ${SITE_NAME}`,
    default: SITE_TITLE,
  },
  description: SITE_DESCRIPTION,
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
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    site: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
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
