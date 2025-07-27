interface BundleJsBadgeProps {
  packageName: string;
}

export function BundleJsBadge({ packageName }: BundleJsBadgeProps) {
  const badgeUrl = `https://deno.bundlejs.com/badge?q=${packageName}`;
  const bundleJsUrl = `https://bundlejs.com/?q=${packageName}`;
  const altText = `Bundle Js ${packageName}`;

  return (
    <a href={bundleJsUrl}>
      <img src={badgeUrl} alt={altText} />
    </a>
  );
}
