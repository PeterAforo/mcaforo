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
