import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function main() {
  // Create permissions
  const superuserPermission = await prisma.permission.upsert({
    where: { name: 'superuser' },
    update: {},
    create: { name: 'superuser' },
  });

  const basicPermission = await prisma.permission.upsert({
    where: { name: 'read_only' },
    update: {},
    create: { name: 'read_only' },
  });

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin' },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: { name: 'user' },
  });

  // Assign permissions to roles
  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: adminRole.id, permissionId: superuserPermission.id } },
    update: {},
    create: {
      roleId: adminRole.id,
      permissionId: superuserPermission.id,
    },
  });

  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: userRole.id, permissionId: basicPermission.id } },
    update: {},
    create: {
      roleId: userRole.id,
      permissionId: basicPermission.id,
    },
  });

  console.log('✅ Initial roles and permissions created');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
