import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const chatSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  history: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ).optional(),
})

const knowledgeBase = {
  services: {
    keywords: ['service', 'offer', 'provide', 'do you do', 'what do you'],
    response: `We offer a comprehensive range of digital services:

🌐 **Web & Mobile Development** - Custom websites, web apps, and mobile applications
⚙️ **Business Automation** - Workflow automation and system integrations
🎨 **UI/UX Design** - User research, wireframing, and visual design
📊 **Data Analytics** - Custom dashboards and business intelligence
🔒 **Cybersecurity** - Security assessments and compliance support
🛠️ **Managed IT Support** - Hosting, maintenance, and 24/7 monitoring

Would you like to learn more about any specific service?`,
  },
  pricing: {
    keywords: ['price', 'cost', 'how much', 'pricing', 'budget', 'expensive', 'cheap', 'afford'],
    response: `Our pricing varies based on project scope and requirements:

**Web Development**: Starting from GHS 5,000 for simple sites, up to GHS 150,000+ for enterprise solutions

**Business Automation**: GHS 3,000 - GHS 50,000+ depending on complexity

**UI/UX Design**: GHS 3,000 - GHS 75,000 based on project scope

**Managed IT Support**: Monthly plans from GHS 500 - GHS 15,000+

We offer flexible payment options including milestone-based payments. Would you like to schedule a free consultation to discuss your specific needs?`,
  },
  contact: {
    keywords: ['contact', 'reach', 'call', 'email', 'phone', 'talk', 'speak', 'meet'],
    response: `You can reach us through several channels:

📧 **Email**: hello@mcaforo.com
📞 **Phone**: +233 00 000 0000
📍 **Location**: Accra, Ghana

**Business Hours**:
Monday - Friday: 9:00 AM - 6:00 PM
Saturday: 10:00 AM - 2:00 PM

You can also fill out our contact form at /contact or book a call directly. Would you like me to help you with anything specific?`,
  },
  support: {
    keywords: ['help', 'support', 'issue', 'problem', 'ticket', 'bug', 'fix', 'not working'],
    response: `I'm sorry to hear you're having issues! Here's how to get support:

1. **Client Portal**: Log in at /portal to create a support ticket
2. **Email**: Send details to support@mcaforo.com
3. **Phone**: Call us for urgent issues

If you're an existing client, creating a ticket in the portal is the fastest way to get help as it goes directly to our support team.

Can you tell me more about what you need help with?`,
  },
  project: {
    keywords: ['project', 'timeline', 'how long', 'duration', 'deadline', 'when'],
    response: `Project timelines vary based on scope:

⏱️ **Simple Website**: 2-4 weeks
⏱️ **Custom Web App**: 6-12 weeks
⏱️ **Mobile App**: 8-16 weeks
⏱️ **Business Automation**: 4-8 weeks
⏱️ **Full Digital Transformation**: 3-6 months

We follow an agile methodology with regular milestones and updates. Every project starts with a discovery phase to define clear deliverables and timelines.

Would you like to discuss a specific project?`,
  },
  process: {
    keywords: ['process', 'how do you work', 'methodology', 'approach', 'steps'],
    response: `Our proven process ensures successful project delivery:

1️⃣ **Discovery** - Understanding your needs and goals
2️⃣ **Planning** - Defining scope, timeline, and milestones
3️⃣ **Design** - Creating wireframes and visual designs
4️⃣ **Development** - Building with regular progress updates
5️⃣ **Testing** - Thorough QA and user acceptance testing
6️⃣ **Launch** - Deployment and go-live support
7️⃣ **Support** - Ongoing maintenance and optimization

Throughout the process, you'll have access to your client portal to track progress, communicate with our team, and manage your project.`,
  },
  portal: {
    keywords: ['portal', 'login', 'account', 'sign up', 'register', 'dashboard'],
    response: `Our Client Portal gives you full visibility into your projects:

✅ Track project progress and milestones
✅ View and pay invoices
✅ Create and manage support tickets
✅ Access project documentation
✅ Communicate with your project team

**Existing clients**: Log in at /login
**New clients**: Sign up at /signup after we start working together

Need help accessing your account?`,
  },
}

function findBestResponse(message: string): string {
  const lowerMessage = message.toLowerCase()

  // Check each knowledge base entry
  for (const [, entry] of Object.entries(knowledgeBase)) {
    for (const keyword of entry.keywords) {
      if (lowerMessage.includes(keyword)) {
        return entry.response
      }
    }
  }

  // Greeting detection
  if (/^(hi|hello|hey|good morning|good afternoon|good evening)/i.test(lowerMessage)) {
    return `Hello! 👋 Welcome to McAforo. I'm here to help you with:

• Information about our services
• Pricing and project estimates
• Support and contact options
• General questions

What would you like to know?`
  }

  // Thank you detection
  if (/thank|thanks|appreciate/i.test(lowerMessage)) {
    return `You're welcome! 😊 Is there anything else I can help you with?`
  }

  // Default response
  return `I'm not sure I understood that completely. Here are some things I can help with:

• **Services** - Learn about what we offer
• **Pricing** - Get cost estimates
• **Contact** - Reach our team
• **Support** - Get help with issues
• **Process** - Understand how we work

You can also type your question differently, or contact our team directly at hello@mcaforo.com for personalized assistance.`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message } = chatSchema.parse(body)

    // Simple rule-based response for now
    // Can be enhanced with AI/LLM integration later
    const response = findBestResponse(message)

    return NextResponse.json({ response })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Chatbot error:', error)
    return NextResponse.json(
      { response: "I'm having trouble processing your request. Please try again or contact us directly." },
      { status: 200 }
    )
  }
}
