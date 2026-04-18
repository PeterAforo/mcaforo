/**
 * One-time migration: MDX files in /content/blog -> BlogPost rows.
 *
 * Run once after Sprint 5 migration is applied:
 *   npx tsx scripts/migrate-mdx-to-db.ts
 *
 * Safe to run multiple times — uses upsert on slug.
 */
import fs from 'fs/promises'
import path from 'path'
import matter from 'gray-matter'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function walk(dir: string): Promise<string[]> {
  const out: string[] = []
  let entries: string[] = []
  try {
    entries = await fs.readdir(dir)
  } catch {
    return out
  }
  for (const e of entries) {
    const full = path.join(dir, e)
    const st = await fs.stat(full)
    if (st.isDirectory()) out.push(...(await walk(full)))
    else if (e.endsWith('.mdx') || e.endsWith('.md')) out.push(full)
  }
  return out
}

function mdToTipTap(md: string): { type: 'doc'; content: unknown[] } {
  // Minimal markdown->tiptap: split paragraphs. Good enough for migration.
  // Power users can re-edit in the admin rich text editor.
  const paragraphs = md.split(/\n{2,}/).filter((p) => p.trim())
  return {
    type: 'doc',
    content: paragraphs.map((p) => {
      if (p.startsWith('# ')) return { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: p.slice(2) }] }
      if (p.startsWith('## ')) return { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: p.slice(3) }] }
      if (p.startsWith('### ')) return { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: p.slice(4) }] }
      return { type: 'paragraph', content: [{ type: 'text', text: p }] }
    }),
  }
}

async function main() {
  const root = path.resolve(process.cwd(), 'content', 'blog')
  const files = await walk(root)
  console.log(`Found ${files.length} MDX file(s) in ${root}`)

  let created = 0
  let updated = 0

  for (const file of files) {
    const src = await fs.readFile(file, 'utf8')
    const { data, content } = matter(src)
    const slug = (data.slug as string) || path.basename(file).replace(/\.(md|mdx)$/, '')
    const title = (data.title as string) || slug
    const excerpt = (data.excerpt as string) || (data.description as string) || null
    const tags = Array.isArray(data.tags) ? data.tags : []
    const featuredImage = (data.image as string) || (data.featuredImage as string) || null
    const author = (data.author as string) || 'McAforo Team'
    const publishedAt = data.date ? new Date(data.date as string) : new Date()

    const tiptap = mdToTipTap(content)

    const existing = await prisma.blogPost.findUnique({ where: { slug } })
    if (existing) {
      await prisma.blogPost.update({
        where: { slug },
        data: {
          title,
          excerpt,
          content: (existing.content as unknown as string) ?? JSON.stringify(tiptap),
          tags,
          featuredImage,
          author,
          publishedAt,
          status: 'PUBLISHED' as unknown as 'PUBLISHED',
        },
      })
      updated++
    } else {
      await prisma.blogPost.create({
        data: {
          slug,
          title,
          excerpt,
          content: JSON.stringify(tiptap),
          tags,
          featuredImage,
          author,
          publishedAt,
          status: 'PUBLISHED' as unknown as 'PUBLISHED',
        },
      })
      created++
    }
    console.log(`  ${existing ? 'updated' : 'created'}: ${slug}`)
  }

  console.log(`\nDone. created=${created} updated=${updated}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
