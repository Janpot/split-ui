import withMDX from "@next/mdx";
import rehypeHighlight from "rehype-highlight";

const mdxConfig = withMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [rehypeHighlight],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  experimental: {
    mdxRs: false,
  },
  transpilePackages: ["react-flex-panels"],
  output: "export",
  trailingSlash: true,
};

export default mdxConfig(nextConfig);
