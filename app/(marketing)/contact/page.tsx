'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Send, Loader2, Clock, MessageSquare, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { PageHeader } from '@/components/page-header'
import { AnimatedSection } from '@/components/animations/animated-section'

const services = [
  'Web & Mobile Development',
  'Business Automation',
  'UI/UX Design',
  'Data Analytics',
  'Cybersecurity',
  'Managed IT Support',
  'Other',
]

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      company: formData.get('company'),
      service: formData.get('service'),
      message: formData.get('message'),
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast({
          title: 'Message sent!',
          description: "We'll get back to you as soon as possible.",
        })
        e.currentTarget.reset()
      } else {
        throw new Error('Failed to send message')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Get in Touch"
        subtitle="Have a project in mind? Let's discuss how we can help you achieve your digital goals."
        breadcrumbs={[{ label: 'Contact', href: '/contact' }]}
      />

      {/* Contact Form & Info */}
      <section className="py-20">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-3">
            {/* Contact Info */}
            <AnimatedSection direction="left" className="space-y-8">
              <div>
                <div className="inline-block px-4 py-2 bg-mcaforo-gray/10 text-mcaforo-gray rounded-full text-sm font-medium mb-4">
                  Get in Touch
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">
                  Contact{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-mcaforo-gray to-mcaforo-orange">
                    Information
                  </span>
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Reach out to us through any of these channels
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { icon: Mail, label: 'Email', value: 'hello@mcaforo.com', href: 'mailto:hello@mcaforo.com' },
                  { icon: Phone, label: 'Phone', value: '+233 24 911 6439', href: 'tel:+233249116439' },
                  { icon: MapPin, label: 'Location', value: 'D75, Salamander Close, Lashibi, Tema-Ghana', href: null },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-4 p-4 rounded-xl bg-white border shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-mcaforo-orange text-white">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{item.label}</p>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="text-muted-foreground hover:text-mcaforo-orange transition-colors"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-muted-foreground">{item.value}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                viewport={{ once: true }}
                className="rounded-xl bg-mcaforo-orange p-6 text-white"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="h-5 w-5" />
                  <h3 className="font-bold">Business Hours</h3>
                </div>
                <div className="space-y-1 text-sm text-white/90">
                  <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                  <p>Saturday: 10:00 AM - 2:00 PM</p>
                  <p>Sunday: Closed</p>
                </div>
              </motion.div>
            </AnimatedSection>

            {/* Contact Form */}
            <AnimatedSection direction="right" delay={0.2} className="lg:col-span-2">
              <div className="rounded-2xl border bg-white p-8 shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-xl bg-mcaforo-orange flex items-center justify-center text-white">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-bold">Send us a Message</h2>
                </div>
                <p className="text-muted-foreground mb-8">
                  Fill out the form below and we&apos;ll get back to you within
                  24 hours.
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+233 00 000 0000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company Name</Label>
                      <Input
                        id="company"
                        name="company"
                        placeholder="Your Company"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service">Service Interested In</Label>
                    <Select name="service">
                      <SelectTrigger>
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service} value={service}>
                            {service}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Tell us about your project..."
                      rows={5}
                      required
                    />
                  </div>

                  <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* FAQ CTA */}
      <section className="py-20 bg-gradient-to-br from-mcaforo-gray/5 via-white to-mcaforo-orange/5">
        <div className="container">
          <AnimatedSection className="mx-auto max-w-2xl text-center">
            <div className="inline-block px-4 py-2 bg-mcaforo-orange/10 text-mcaforo-orange rounded-full text-sm font-medium mb-4">
              Need Help?
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">
              Have{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-mcaforo-gray to-mcaforo-orange">
                Questions?
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Check out our frequently asked questions or browse our services to
              learn more about what we offer.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button className="bg-mcaforo-orange hover:bg-mcaforo-orange/90 text-white" asChild>
                <Link href="/services">
                  View Services
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" className="border-2 hover:bg-mcaforo-gray/5" asChild>
                <Link href="/about">About Us</Link>
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  )
}
