import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = 'peter.aforo@mcaforo.com'
  
  const user = await prisma.user.update({
    where: { email },
    data: {
      emailVerified: true,
      status: 'ACTIVE',
    },
  })
  
  console.log(`User ${email} verified and activated!`)
  console.log('Status:', user.status)
  console.log('Email Verified:', user.emailVerified)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
