import { Quote } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface TestimonialProps {
  quote: string
  author: string
  role?: string
  company?: string
  image?: string
}

export function Testimonial({
  quote,
  author,
  role,
  company,
  image,
}: TestimonialProps) {
  const initials = author
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <div className="my-12 rounded-xl bg-muted/50 p-8">
      <Quote className="h-8 w-8 text-primary/20" />
      <blockquote className="mt-4 text-lg italic">&ldquo;{quote}&rdquo;</blockquote>
      <div className="mt-6 flex items-center gap-4">
        <Avatar>
          {image && <AvatarImage src={image} alt={author} />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-semibold">{author}</div>
          {(role || company) && (
            <div className="text-sm text-muted-foreground">
              {role}
              {role && company && ', '}
              {company}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
