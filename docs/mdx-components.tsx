import type { MDXComponents } from 'mdx/types';
import Header from '@/components/Header';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (props) => <Header level={1} {...props} />,
    h2: (props) => <Header level={2} {...props} />,
    h3: (props) => <Header level={3} {...props} />,
    h4: (props) => <Header level={4} {...props} />,
    h5: (props) => <Header level={5} {...props} />,
    h6: (props) => <Header level={6} {...props} />,
    ...components,
  };
}
