import withMDX from "@next/mdx";
import { NextConfig } from "next";
import rehypeHighlight from "rehype-highlight";

const mdxConfig = withMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [rehypeHighlight],
  },
});

const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  experimental: {
    mdxRs: true,
  },
  eslint: {
    // Already handled by monorepo setup
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Already handled by monorepo setup
    ignoreBuildErrors: true,
  },
  transpilePackages: ["react-flex-panels"],
};

export default mdxConfig(nextConfig);
