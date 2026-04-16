import { compile, run } from '@mdx-js/mdx'
import * as runtime from 'react/jsx-runtime'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'

export async function compileMDX(source: string) {
  const code = await compile(source, {
    outputFormat: 'function-body',
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug],
  })

  const { default: MDXContent } = await run(String(code), {
    ...runtime,
    baseUrl: import.meta.url,
  })

  return MDXContent
}
