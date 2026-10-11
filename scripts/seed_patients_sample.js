const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) return;

  const count = await prisma.patient.count();
  if (count <= 1) {
    await prisma.patient.create({
      data: {
        userId: user.id,
        firstName: 'Carlos',
        lastName: 'Ruiz Navarro',
        email: 'carlos.ruiz.salud@gmail.com',
        phone: '+34 612 345 678',
        birthDate: new Date('1991-05-14'),
        sex: 'MALE',
        heightCm: 178,
        objective: 'MAINTENANCE',
        activityLevel: 'MODERATE',
        anamnesisStatus: 'NOT_SENT',
      }
    });

    await prisma.patient.create({
      data: {
        userId: user.id,
        firstName: 'Laura',
        lastName: 'Méndez Santos',
        email: 'laura.mendez.nutri@gmail.com',
        phone: '+34 699 876 543',
        birthDate: new Date('1996-11-23'),
        sex: 'FEMALE',
        heightCm: 165,
        objective: 'WEIGHT_LOSS',
        activityLevel: 'LIGHT',
        anamnesisStatus: 'NOT_SENT',
      }
    });

    console.log('Created sample patients with NOT_SENT status!');
  }

  const list = await prisma.patient.findMany({
    select: { id: true, firstName: true, lastName: true, anamnesisStatus: true, email: true }
  });
  console.log('All patients in DB:', list);
}

main().catch(console.error).finally(() => prisma.$disconnect());
