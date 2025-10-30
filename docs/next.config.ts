import withMDX from '@next/mdx';
import { NextConfig } from 'next';
import path from 'path';

const enableCsp = false;

const mdxConfig = withMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [['remark-gfm']],
    rehypePlugins: [['rehype-highlight']],
  },
});

function getPreviewPackageVersion() {
  if (
    process.env.VERCEL_ENV === 'production' ||
    !process.env.VERCEL_GIT_COMMIT_SHA
  ) {
    return 'latest';
  }
  const shortSha = process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  return `https://pkg.pr.new/@split-ui/react@${shortSha}`;
}

const cspHeader = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
];

const nextConfig: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  experimental: {
    mdxRs: false,
  },
  typescript: {
    // Already handled by monorepo setup
    ignoreBuildErrors: true,
  },
  env: {
    PREVIEW_PACKAGE_VERSION: getPreviewPackageVersion(),
  },
  webpack: (config) => {
    // Add demo loader for files with *.demo.* pattern
    config.module.rules.push({
      test: /\.(js|jsx|ts|tsx)$/,
      resourceQuery: /demo/,
      use: path.resolve(__dirname, 'loaders/demo-loader.mjs'),
    });

    return config;
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/react',
        permanent: false,
      },
    ];
  },

  async headers() {
    return enableCsp
      ? [
          {
            source: '/(.*)',
            headers: [
              {
                key: 'Content-Security-Policy',
                value: cspHeader.join('; '),
              },
            ],
          },
        ]
      : [];
  },
};

export default mdxConfig(nextConfig);
