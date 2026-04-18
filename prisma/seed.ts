import { PrismaClient, RoleName } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create roles
  const roles = await Promise.all(
    Object.values(RoleName).map((name) =>
      prisma.role.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  )
  console.log(`Created ${roles.length} roles`)

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@mcaforo.com' },
    update: {},
    create: {
      email: 'admin@mcaforo.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      emailVerified: true,
      status: 'ACTIVE',
    },
  })

  // Assign admin role
  const adminRole = roles.find((r) => r.name === 'ADMIN')
  if (adminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    })
  }
  console.log('Created admin user: admin@mcaforo.com')

  // Create sample services
  const services = [
    {
      name: 'Web & Mobile Development',
      slug: 'web-development',
      description: 'Custom websites and mobile apps built with modern technologies.',
    },
    {
      name: 'Business Automation',
      slug: 'business-automation',
      description: 'Streamline operations with custom workflows and integrations.',
    },
    {
      name: 'UI/UX Design',
      slug: 'ui-ux-design',
      description: 'User-centered design for intuitive digital experiences.',
    },
    {
      name: 'Data Analytics',
      slug: 'data-analytics',
      description: 'Transform data into actionable insights with dashboards.',
    },
    {
      name: 'Cybersecurity',
      slug: 'cybersecurity',
      description: 'Protect your business with security assessments.',
    },
    {
      name: 'Managed IT Support',
      slug: 'managed-it',
      description: 'Reliable IT support with SLA-backed service tiers.',
    },
    {
      name: 'Domain Registration',
      slug: 'domain-registration',
      description: 'Register and manage domain names with competitive pricing and free WHOIS privacy.',
    },
    {
      name: 'Web Hosting',
      slug: 'web-hosting',
      description: 'Fast, secure and reliable web hosting with 99.9% uptime guarantee.',
    },
  ]

  for (const service of services) {
    await prisma.service.upsert({
      where: { slug: service.slug },
      update: {},
      create: service,
    })
  }
  console.log(`Created ${services.length} services`)

  // Create sample plans for Web Development
  const webDevService = await prisma.service.findUnique({
    where: { slug: 'web-development' },
  })

  if (webDevService) {
    const plans = [
      {
        serviceId: webDevService.id,
        name: 'Starter',
        description: 'Perfect for landing pages and simple websites',
        priceMin: 5000,
        priceMax: 15000,
        productType: 'ONE_TIME' as const,
        features: [
          'Up to 5 pages',
          'Responsive design',
          'Basic SEO setup',
          'Contact form',
          '1 month support',
        ],
      },
      {
        serviceId: webDevService.id,
        name: 'Growth',
        description: 'For business websites and e-commerce',
        priceMin: 15000,
        priceMax: 50000,
        productType: 'ONE_TIME' as const,
        features: [
          'Up to 15 pages',
          'Custom design',
          'CMS integration',
          'E-commerce ready',
          'Advanced SEO',
          '3 months support',
        ],
      },
      {
        serviceId: webDevService.id,
        name: 'Enterprise',
        description: 'Custom applications and platforms',
        priceMin: 50000,
        priceMax: 150000,
        productType: 'ONE_TIME' as const,
        features: [
          'Unlimited pages',
          'Custom functionality',
          'API integrations',
          'Performance optimization',
          'Security hardening',
          '6 months support',
          'Priority support',
        ],
      },
    ]

    for (const plan of plans) {
      await prisma.plan.create({
        data: plan,
      })
    }
    console.log('Created sample plans for Web Development')
  }

  // Create hosting plans (recurring)
  const managedItService = await prisma.service.findUnique({
    where: { slug: 'managed-it' },
  })

  if (managedItService) {
    const hostingPlans = [
      {
        serviceId: managedItService.id,
        name: 'Shared Hosting',
        description: 'Perfect for small websites',
        priceMin: 50,
        priceMax: 50,
        productType: 'RECURRING' as const,
        billingCycle: 'MONTHLY' as const,
        features: [
          '5GB storage',
          '100GB bandwidth',
          'Free SSL',
          'Email accounts',
          'Daily backups',
        ],
      },
      {
        serviceId: managedItService.id,
        name: 'VPS Hosting',
        description: 'For growing businesses',
        priceMin: 200,
        priceMax: 200,
        productType: 'RECURRING' as const,
        billingCycle: 'MONTHLY' as const,
        features: [
          '50GB SSD storage',
          'Unlimited bandwidth',
          '2GB RAM',
          'Root access',
          'Free SSL',
          'Daily backups',
        ],
      },
      {
        serviceId: managedItService.id,
        name: 'Managed Hosting',
        description: 'Full-service hosting solution',
        priceMin: 500,
        priceMax: 500,
        productType: 'RECURRING' as const,
        billingCycle: 'MONTHLY' as const,
        features: [
          '100GB SSD storage',
          'Unlimited bandwidth',
          '4GB RAM',
          'Managed updates',
          'Security monitoring',
          'Priority support',
          'Daily backups',
        ],
      },
    ]

    for (const plan of hostingPlans) {
      await prisma.plan.create({
        data: plan,
      })
    }
    console.log('Created hosting plans')
  }

  // Create sample company and client user (for development)
  const clientPassword = await bcrypt.hash('client123', 12)
  const clientUser = await prisma.user.upsert({
    where: { email: 'client@example.com' },
    update: {},
    create: {
      email: 'client@example.com',
      passwordHash: clientPassword,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+233200000000',
      emailVerified: true,
      status: 'ACTIVE',
    },
  })

  const clientRole = roles.find((r) => r.name === 'CLIENT_USER')
  if (clientRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: clientUser.id,
          roleId: clientRole.id,
        },
      },
      update: {},
      create: {
        userId: clientUser.id,
        roleId: clientRole.id,
      },
    })
  }

  const company = await prisma.company.upsert({
    where: { id: 'sample-company' },
    update: {},
    create: {
      id: 'sample-company',
      name: 'Sample Company Ltd',
      email: 'info@samplecompany.com',
      phone: '+233200000001',
      address: 'Accra, Ghana',
    },
  })

  await prisma.companyUser.upsert({
    where: {
      companyId_userId: {
        companyId: company.id,
        userId: clientUser.id,
      },
    },
    update: {},
    create: {
      companyId: company.id,
      userId: clientUser.id,
      isPrimary: true,
    },
  })
  console.log('Created sample client: client@example.com')

  // Create sample project
  const project = await prisma.project.create({
    data: {
      companyId: company.id,
      name: 'Company Website Redesign',
      description: 'Complete redesign of the company website with modern UI/UX',
      status: 'IN_PROGRESS',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-03-31'),
      milestones: {
        create: [
          {
            name: 'Discovery & Planning',
            description: 'Requirements gathering and project planning',
            status: 'COMPLETED',
            dueDate: new Date('2024-01-15'),
            completedAt: new Date('2024-01-14'),
          },
          {
            name: 'Design Phase',
            description: 'UI/UX design and prototyping',
            status: 'COMPLETED',
            dueDate: new Date('2024-02-01'),
            completedAt: new Date('2024-01-30'),
          },
          {
            name: 'Development',
            description: 'Frontend and backend development',
            status: 'IN_PROGRESS',
            dueDate: new Date('2024-03-01'),
          },
          {
            name: 'Testing & Launch',
            description: 'QA testing and production deployment',
            status: 'PENDING',
            dueDate: new Date('2024-03-31'),
          },
        ],
      },
    },
  })
  console.log('Created sample project with milestones')

  // Create sample ticket
  await prisma.ticket.create({
    data: {
      companyId: company.id,
      creatorId: clientUser.id,
      subject: 'Question about project timeline',
      description: 'I would like to know if we are on track for the March deadline.',
      category: 'General',
      priority: 'MEDIUM',
      status: 'OPEN',
      messages: {
        create: [
          {
            userId: clientUser.id,
            content: 'I would like to know if we are on track for the March deadline.',
          },
        ],
      },
    },
  })
  console.log('Created sample ticket')

  // Create domain registration plans
  const domainService = await prisma.service.findUnique({
    where: { slug: 'domain-registration' },
  })

  if (domainService) {
    const existingDomainPlans = await prisma.plan.count({
      where: { serviceId: domainService.id },
    })
    if (existingDomainPlans === 0) {
      const domainPlans = [
        {
          serviceId: domainService.id,
          name: '.com Domain',
          description: 'Most popular TLD for businesses worldwide',
          priceMin: 80,
          priceMax: 80,
          productType: 'RECURRING' as const,
          billingCycle: 'YEARLY' as const,
          features: ['Free WHOIS privacy', 'DNS management', 'Email forwarding', 'Domain lock', 'Auto-renewal'],
        },
        {
          serviceId: domainService.id,
          name: '.com.gh Domain',
          description: 'Ghana commercial domain for local businesses',
          priceMin: 200,
          priceMax: 200,
          productType: 'RECURRING' as const,
          billingCycle: 'YEARLY' as const,
          features: ['Ghana-specific TLD', 'DNS management', 'Email forwarding', 'Local SEO boost'],
        },
        {
          serviceId: domainService.id,
          name: '.org / .net Domain',
          description: 'Alternative TLDs for organizations and networks',
          priceMin: 100,
          priceMax: 120,
          productType: 'RECURRING' as const,
          billingCycle: 'YEARLY' as const,
          features: ['Free WHOIS privacy', 'DNS management', 'Email forwarding', 'Auto-renewal'],
        },
      ]
      for (const plan of domainPlans) {
        await prisma.plan.create({ data: plan })
      }
      console.log('Created domain registration plans')
    }
  }

  // Create web hosting plans
  const webHostingService = await prisma.service.findUnique({
    where: { slug: 'web-hosting' },
  })

  if (webHostingService) {
    const existingHostingPlans = await prisma.plan.count({
      where: { serviceId: webHostingService.id },
    })
    if (existingHostingPlans === 0) {
      const webHostingPlans = [
        {
          serviceId: webHostingService.id,
          name: 'Starter Hosting',
          description: 'Perfect for small websites and blogs',
          priceMin: 80,
          priceMax: 80,
          productType: 'RECURRING' as const,
          billingCycle: 'MONTHLY' as const,
          features: ['10GB SSD Storage', 'Unmetered Bandwidth', 'Free SSL Certificate', '5 Email Accounts', '1 Website', 'Daily Backups'],
        },
        {
          serviceId: webHostingService.id,
          name: 'Business Hosting',
          description: 'For business websites and online stores',
          priceMin: 250,
          priceMax: 250,
          productType: 'RECURRING' as const,
          billingCycle: 'MONTHLY' as const,
          features: ['50GB SSD Storage', 'Unmetered Bandwidth', 'Free SSL Certificate', 'Unlimited Email Accounts', '10 Websites', 'Daily Backups', 'Free CDN', 'Priority Support'],
        },
        {
          serviceId: webHostingService.id,
          name: 'Premium Hosting',
          description: 'High-performance hosting for growing businesses',
          priceMin: 600,
          priceMax: 600,
          productType: 'RECURRING' as const,
          billingCycle: 'MONTHLY' as const,
          features: ['200GB SSD Storage', 'Unmetered Bandwidth', 'Free SSL Certificate', 'Unlimited Email Accounts', 'Unlimited Websites', 'Hourly Backups', 'Free CDN', 'Free Domain', 'Dedicated Support'],
        },
      ]
      for (const plan of webHostingPlans) {
        await prisma.plan.create({ data: plan })
      }
      console.log('Created web hosting plans')
    }
  }

  // Seed Integration Providers
  const integrationProviders = [
    { category: 'PAYMENT' as const, provider: 'flutterwave', name: 'Flutterwave', description: 'Accept payments across Africa', config: { publicKey: '', secretKey: '', encryptionKey: '' }, isActive: true, isDefault: true },
    { category: 'PAYMENT' as const, provider: 'paystack', name: 'Paystack', description: 'Payment gateway for Africa', config: { publicKey: '', secretKey: '' }, isActive: false },
    { category: 'PAYMENT' as const, provider: 'stripe', name: 'Stripe', description: 'Global payment processing', config: { publicKey: '', secretKey: '', webhookSecret: '' }, isActive: false },
    { category: 'SMS' as const, provider: 'mnotify', name: 'mNotify', description: 'SMS service for Ghana', config: { apiKey: '', senderId: 'McAforo' }, isActive: true, isDefault: true },
    { category: 'SMS' as const, provider: 'twilio', name: 'Twilio', description: 'Global SMS/Voice/WhatsApp', config: { accountSid: '', authToken: '', fromNumber: '' }, isActive: false },
    { category: 'SMS' as const, provider: 'hubtel', name: 'Hubtel', description: 'SMS and USSD for Africa', config: { clientId: '', clientSecret: '', senderId: 'McAforo' }, isActive: false },
    { category: 'EMAIL' as const, provider: 'smtp', name: 'SMTP', description: 'Generic SMTP email server', config: { host: '', port: 587, user: '', password: '', from: '' }, isActive: true, isDefault: true },
    { category: 'EMAIL' as const, provider: 'sendgrid', name: 'SendGrid', description: 'Email delivery at scale', config: { apiKey: '', from: '' }, isActive: false },
    { category: 'EMAIL' as const, provider: 'resend', name: 'Resend', description: 'Modern email API for developers', config: { apiKey: '', from: '' }, isActive: false },
    { category: 'EMAIL' as const, provider: 'mailgun', name: 'Mailgun', description: 'Transactional email service', config: { apiKey: '', domain: '', from: '' }, isActive: false },
  ]

  for (const ip of integrationProviders) {
    await prisma.integrationProvider.upsert({
      where: { category_provider: { category: ip.category, provider: ip.provider } },
      update: {},
      create: ip,
    })
  }
  console.log(`Seeded ${integrationProviders.length} integration providers`)

  // Seed Menus
  const headerMenu = await prisma.menu.upsert({
    where: { location: 'header' },
    update: {},
    create: { name: 'Header Menu', location: 'header' },
  })

  const existingItems = await prisma.menuItem.count({ where: { menuId: headerMenu.id } })
  if (existingItems === 0) {
    const headerItems = [
      { label: 'Home', url: '/', order: 1 },
      { label: 'About', url: '/about', order: 2 },
      { label: 'Services', url: '/services', order: 3 },
      { label: 'Products', url: '/products', order: 4 },
      { label: 'Projects', url: '/projects', order: 5 },
      { label: 'Blog', url: '/blog', order: 6 },
      { label: 'Contact', url: '/contact', order: 7 },
    ]
    for (const item of headerItems) {
      await prisma.menuItem.create({ data: { ...item, menuId: headerMenu.id } })
    }
    console.log('Seeded header menu items')
  }

  const footerMenu = await prisma.menu.upsert({
    where: { location: 'footer' },
    update: {},
    create: { name: 'Footer Menu', location: 'footer' },
  })

  const existingFooterItems = await prisma.menuItem.count({ where: { menuId: footerMenu.id } })
  if (existingFooterItems === 0) {
    const footerItems = [
      { label: 'Privacy Policy', url: '/privacy', order: 1 },
      { label: 'Terms of Service', url: '/terms', order: 2 },
      { label: 'Contact', url: '/contact', order: 3 },
    ]
    for (const item of footerItems) {
      await prisma.menuItem.create({ data: { ...item, menuId: footerMenu.id } })
    }
    console.log('Seeded footer menu items')
  }

  // Seed Pages
  const pages = [
    {
      slug: 'home',
      title: 'Home',
      content: '<h1>Welcome to McAforo</h1><p>Digital Solutions for Modern Businesses</p>',
      excerpt: 'Digital Solutions for Modern Businesses',
      status: 'PUBLISHED' as const,
      publishedAt: new Date(),
    },
    {
      slug: 'about',
      title: 'About Us',
      content: '<h1>About McAforo</h1><p>We help businesses build, automate, and grow.</p>',
      excerpt: 'Learn about our team and mission',
      status: 'PUBLISHED' as const,
      publishedAt: new Date(),
    },
  ]
  for (const page of pages) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      update: {},
      create: page,
    })
  }
  console.log('Seeded CMS pages')

  // Seed Blog Categories
  const blogCategories = [
    { name: 'Technology', slug: 'technology', description: 'Tech news and insights' },
    { name: 'Business', slug: 'business', description: 'Business tips and strategies' },
    { name: 'Tutorials', slug: 'tutorials', description: 'How-to guides and tutorials' },
  ]
  for (const cat of blogCategories) {
    await prisma.blogCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
  }
  console.log('Seeded blog categories')

  // Seed one sample blog post
  const techCat = await prisma.blogCategory.findUnique({ where: { slug: 'technology' } })
  if (techCat) {
    await prisma.blogPost.upsert({
      where: { slug: 'getting-started-with-automation' },
      update: {},
      create: {
        slug: 'getting-started-with-automation',
        title: 'Getting Started with Business Automation',
        excerpt: 'Learn how to automate repetitive tasks and scale your business.',
        content: '<p>Business automation is transforming how companies operate...</p>',
        author: 'McAforo Team',
        categoryId: techCat.id,
        tags: ['automation', 'business', 'productivity'],
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    })
    console.log('Seeded sample blog post')
  }

  // ---- CMS Sprint 1: SiteSettings singleton ----
  await prisma.siteSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      siteName: 'McAforo',
      tagline: 'Digital Solutions for Modern Businesses',
      contactEmail: 'hello@mcaforo.com',
      contactPhone: '+233 24 911 6439',
      address: 'D75, Salamander Close, Lashibi, Tema-Ghana',
      socials: {
        linkedin: '',
        twitter: '',
        facebook: '',
        instagram: '',
      },
    },
  })
  console.log('Seeded SiteSettings singleton')

  // ---- CMS Sprint 4: Marketing content seed ----
  const marketingServices = [
    { slug: 'web-mobile-development', title: 'Web & Mobile Development', description: 'Custom websites and mobile apps built with modern technologies for optimal performance.', icon: 'Code', order: 1, features: ['Custom web apps', 'Mobile apps (iOS & Android)', 'E-commerce platforms', 'Progressive Web Apps'] },
    { slug: 'business-automation', title: 'Business Automation', description: 'Streamline operations with custom workflows, integrations, and automation solutions.', icon: 'Cog', order: 2, features: ['Workflow automation', 'System integrations', 'Custom API development', 'Process optimization'] },
    { slug: 'ui-ux-design', title: 'UI/UX Design', description: 'User-centered design that creates intuitive and engaging digital experiences.', icon: 'Palette', order: 3, features: ['User research', 'Wireframing & prototyping', 'Visual design', 'Usability testing'] },
    { slug: 'data-analytics', title: 'Data Analytics', description: 'Transform data into actionable insights with custom dashboards and reporting.', icon: 'BarChart3', order: 4, features: ['Custom dashboards', 'Business intelligence', 'Data visualization', 'Reporting automation'] },
    { slug: 'cybersecurity', title: 'Cybersecurity', description: 'Protect your business with security assessments and best practices implementation.', icon: 'Shield', order: 5, features: ['Security assessments', 'Vulnerability testing', 'Security training', 'Compliance support'] },
    { slug: 'managed-it', title: 'Managed IT Support', description: 'Reliable IT support with SLA-backed service tiers for your business needs.', icon: 'Headphones', order: 6, features: ['Web hosting', 'Domain management', 'Website maintenance', '24/7 monitoring'] },
  ]
  for (const s of marketingServices) {
    await prisma.marketingService.upsert({
      where: { slug: s.slug },
      update: {},
      create: { ...s, status: 'PUBLISHED' },
    })
  }
  console.log(`Seeded ${marketingServices.length} marketing services`)

  const marketingProducts = [
    { slug: 'school-management', title: 'School Management System', tagline: 'Complete solution for educational institutions', description: 'Student management, grading, attendance, and parent portals. Streamline your school with AI-powered automation.', icon: 'GraduationCap', order: 1, features: ['Student Information System', 'Online Grading', 'Attendance Tracking', 'Parent Portal', 'Fee Management', 'Timetable', 'Library', 'SMS Notifications'] },
    { slug: 'church-management', title: 'Church Management System', tagline: 'Build stronger communities', description: 'Member management, donations, events, and communication tools for churches of all sizes.', icon: 'Church', order: 2, features: ['Member Database', 'Donation Tracking', 'Event Management', 'Group Management', 'SMS/Email', 'Attendance', 'Financial Reports', 'Mobile App'] },
    { slug: 'hospital-management', title: 'Hospital Management System', tagline: 'Improve patient care', description: 'Patient records, appointments, billing, and pharmacy management with intelligent automation.', icon: 'Building2', order: 3, features: ['Electronic Health Records', 'Appointments', 'Billing', 'Pharmacy', 'Lab Integration', 'Staff Management', 'Inventory', 'Patient Portal'] },
    { slug: 'farmer-management', title: 'Farmer Management System', tagline: 'Empower agricultural businesses', description: 'Crop tracking, inventory, sales, and weather integration for data-driven farming.', icon: 'Leaf', order: 4, features: ['Crop Planning', 'Inventory', 'Sales', 'Weather Data', 'Worker Management', 'Equipment', 'Financial Reports', 'Mobile App'] },
  ]
  for (const p of marketingProducts) {
    await prisma.marketingProduct.upsert({
      where: { slug: p.slug },
      update: {},
      create: { ...p, status: 'PUBLISHED' },
    })
  }
  console.log(`Seeded ${marketingProducts.length} marketing products`)

  const portfolios = [
    { slug: 'ghanatech-ecommerce', client: 'GhanaTech Solutions', title: 'E-Commerce Platform', description: 'Full-stack e-commerce with payment integration and inventory management.', isFeatured: true, order: 1, year: 2025 },
    { slug: 'accra-medical-hms', client: 'Accra Medical Center', title: 'Hospital Management System', description: 'Patient management and appointment scheduling with EHR.', isFeatured: true, order: 2, year: 2025 },
    { slug: 'farmconnect-mobile', client: 'FarmConnect Ghana', title: 'Mobile Farming App', description: 'Connects farmers with buyers; provides market insights and weather data.', order: 3, year: 2024 },
    { slug: 'edufirst-lms', client: 'EduFirst Academy', title: 'Learning Management System', description: 'Online learning with video courses, assessments, and certifications.', order: 4, year: 2024 },
  ]
  for (const p of portfolios) {
    await prisma.portfolio.upsert({ where: { slug: p.slug }, update: {}, create: { ...p, status: 'PUBLISHED' } })
  }
  console.log(`Seeded ${portfolios.length} portfolio items`)

  const team = [
    { slug: 'founder-ceo', name: 'McAforo Founder', role: 'CEO & Technical Director', order: 1 },
  ]
  for (const t of team) {
    await prisma.teamMember.upsert({ where: { slug: t.slug }, update: {}, create: t })
  }

  const testimonials = [
    { authorName: 'Kwame Asante', authorRole: 'CEO', authorCompany: 'GhanaTech Solutions', quote: 'McAforo delivered beyond our expectations. The e-commerce platform doubled our online sales within 3 months.', rating: 5, isFeatured: true, order: 1 },
    { authorName: 'Ama Boateng', authorRole: 'Administrator', authorCompany: 'Accra Medical Center', quote: 'Their hospital management system transformed how we handle patient care. Professional and responsive team.', rating: 5, isFeatured: true, order: 2 },
  ]
  for (const t of testimonials) {
    const exists = await prisma.testimonial.findFirst({ where: { authorName: t.authorName, authorCompany: t.authorCompany } })
    if (!exists) await prisma.testimonial.create({ data: t })
  }

  const faqs = [
    { question: 'How long does a typical project take?', answer: 'Small websites take 2-4 weeks. Complex applications can take 2-6 months depending on scope.', category: 'Process', order: 1 },
    { question: 'Do you provide ongoing support?', answer: 'Yes. All projects include a support period; ongoing plans are available with SLA-backed tiers.', category: 'Support', order: 2 },
    { question: 'What payment methods do you accept?', answer: 'Mobile money, bank transfer, and major cards via Flutterwave.', category: 'Billing', order: 3 },
  ]
  for (const f of faqs) {
    const exists = await prisma.fAQ.findFirst({ where: { question: f.question } })
    if (!exists) await prisma.fAQ.create({ data: f })
  }

  const values = [
    { title: 'Client-Focused', description: 'Your success is our success. We listen, understand, and deliver solutions that truly meet your needs.', icon: 'Users', order: 1 },
    { title: 'Excellence', description: 'Highest standards from code quality to customer service.', icon: 'Award', order: 2 },
    { title: 'Innovation', description: 'We stay ahead of trends to bring you modern, future-proof solutions.', icon: 'Lightbulb', order: 3 },
    { title: 'Integrity', description: 'Honest communication, transparent pricing, and ethical practices.', icon: 'Heart', order: 4 },
  ]
  for (const v of values) {
    const exists = await prisma.value.findFirst({ where: { title: v.title } })
    if (!exists) await prisma.value.create({ data: v })
  }

  const processSteps = [
    { step: 1, title: 'Discovery', description: 'Understanding your business, goals, challenges, and audience.', icon: 'Search', order: 1 },
    { step: 2, title: 'Strategy', description: 'Comprehensive strategy and project plan tailored to your needs.', icon: 'Rocket', order: 2 },
    { step: 3, title: 'Design', description: 'Intuitive, beautiful interfaces aligned with your brand.', icon: 'PenTool', order: 3 },
    { step: 4, title: 'Development', description: 'Building with modern technologies and best practices.', icon: 'Code2', order: 4 },
    { step: 5, title: 'Testing', description: 'Rigorous QA ensures everything works perfectly.', icon: 'TestTube', order: 5 },
    { step: 6, title: 'Launch & Support', description: 'Deployment plus ongoing support for continued success.', icon: 'HeadphonesIcon', order: 6 },
  ]
  for (const s of processSteps) {
    const exists = await prisma.processStep.findFirst({ where: { step: s.step, title: s.title } })
    if (!exists) await prisma.processStep.create({ data: s })
  }

  const stats = [
    { label: 'Years of Excellence', value: '5', suffix: '+', order: 1 },
    { label: 'Projects Delivered', value: '50', suffix: '+', order: 2 },
    { label: 'Happy Clients', value: '30', suffix: '+', order: 3 },
    { label: 'Uptime SLA', value: '99.9', suffix: '%', order: 4 },
  ]
  for (const s of stats) {
    const exists = await prisma.stat.findFirst({ where: { label: s.label } })
    if (!exists) await prisma.stat.create({ data: s })
  }

  console.log('Seeded marketing content (testimonials, FAQs, values, process steps, stats)')

  // ---- CMS Sprint 1: demo content editor account ----
  const editorPassword = await bcrypt.hash('editor123', 12)
  const editorUser = await prisma.user.upsert({
    where: { email: 'editor@mcaforo.com' },
    update: {},
    create: {
      email: 'editor@mcaforo.com',
      passwordHash: editorPassword,
      firstName: 'Content',
      lastName: 'Editor',
      emailVerified: true,
      status: 'ACTIVE',
    },
  })
  const editorRole = roles.find((r) => r.name === 'CONTENT_EDITOR')
  if (editorRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: { userId: editorUser.id, roleId: editorRole.id },
      },
      update: {},
      create: { userId: editorUser.id, roleId: editorRole.id },
    })
    console.log('Created content editor: editor@mcaforo.com / editor123')
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
