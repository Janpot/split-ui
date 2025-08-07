import withMDX from '@next/mdx';
import { NextConfig } from 'next';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

const mdxConfig = withMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeHighlight],
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
  return `https://pkg.pr.new/react-flex-panels@${shortSha}`;
}

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
};

export default mdxConfig(nextConfig);
