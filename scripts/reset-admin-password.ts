import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const email = (process.env.EVSOFTWARE_ADMIN_EMAIL || process.env.ADMIN_EMAIL)?.trim().toLowerCase()
const password = process.env.EVSOFTWARE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD

if (!email || !password || password.length < 14) {
  throw new Error('Define EVSOFTWARE_ADMIN_EMAIL y EVSOFTWARE_ADMIN_PASSWORD (mínimo 14 caracteres).')
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
