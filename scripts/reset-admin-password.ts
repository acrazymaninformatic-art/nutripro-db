import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const email = (process.env.EVSOFTWARE_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'info@evavidalnutricion.com').trim().toLowerCase()
const password = process.env.EVSOFTWARE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD

if (!password || password.length < 12) {
  throw new Error('Define EVSOFTWARE_ADMIN_PASSWORD o ADMIN_PASSWORD con al menos 12 caracteres.')
}

const prisma = new PrismaClient()
try {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (!user) throw new Error('No existe un usuario con EVSOFTWARE_ADMIN_EMAIL.')
  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash, passwordChangeRequired: false } })
  console.log('Contraseña actualizada.')
} finally {
  await prisma.$disconnect()
}
