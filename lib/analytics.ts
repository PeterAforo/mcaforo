type EventName =
  | 'page_view'
  | 'contact_form_submit'
  | 'newsletter_subscribe'
  | 'service_view'
  | 'case_study_view'
  | 'blog_post_view'
  | 'cta_click'
  | 'portal_login'
  | 'portal_signup'
  | 'ticket_create'
  | 'invoice_pay'
  | 'subscription_start'

interface EventProperties {
  [key: string]: string | number | boolean | undefined
}

class Analytics {
  private isEnabled: boolean

  constructor() {
    this.isEnabled = typeof window !== 'undefined'
  }

  track(eventName: EventName, properties?: EventProperties): void {
    if (!this.isEnabled) return

    const event = {
      name: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        referrer: document.referrer,
      },
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', event)
    }

    // Send to analytics provider
    // Example: Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('event', eventName, properties)
    }

    // Example: Custom analytics endpoint
    // fetch('/api/analytics', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(event),
    // })
  }

  pageView(pathname: string, title?: string): void {
    this.track('page_view', { pathname, title })
  }

  contactFormSubmit(service?: string): void {
    this.track('contact_form_submit', { service })
  }

  newsletterSubscribe(): void {
    this.track('newsletter_subscribe')
  }

  serviceView(slug: string, name: string): void {
    this.track('service_view', { slug, name })
  }

  caseStudyView(slug: string, client: string): void {
    this.track('case_study_view', { slug, client })
  }

  blogPostView(slug: string, title: string): void {
    this.track('blog_post_view', { slug, title })
  }

  ctaClick(location: string, destination: string): void {
    this.track('cta_click', { location, destination })
  }

  portalLogin(): void {
    this.track('portal_login')
  }

  portalSignup(): void {
    this.track('portal_signup')
  }

  ticketCreate(category: string): void {
    this.track('ticket_create', { category })
  }

  invoicePay(invoiceId: string, amount: number): void {
    this.track('invoice_pay', { invoiceId, amount })
  }

  subscriptionStart(planId: string, planName: string): void {
    this.track('subscription_start', { planId, planName })
  }
}

export const analytics = new Analytics()
