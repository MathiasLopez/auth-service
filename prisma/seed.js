import { PrismaClient } from '../src/generated/prisma/index.js';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
const prisma = new PrismaClient();

async function main() {
  // Create permissions
  const superuserPermission = await prisma.permission.upsert({
    where: { name: 'superuser' },
    update: {},
    create: { name: 'superuser', createdBy: SYSTEM_USER_ID, updatedBy: SYSTEM_USER_ID },
  });

  const basicPermission = await prisma.permission.upsert({
    where: { name: 'read_only' },
    update: {},
    create: { name: 'read_only', createdBy: SYSTEM_USER_ID, updatedBy: SYSTEM_USER_ID },
  });

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin', createdBy: SYSTEM_USER_ID, updatedBy: SYSTEM_USER_ID },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: { name: 'user', createdBy: SYSTEM_USER_ID, updatedBy: SYSTEM_USER_ID },
  });

  // Assign permissions to roles
  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: adminRole.id, permissionId: superuserPermission.id } },
    update: {},
    create: {
      roleId: adminRole.id,
      permissionId: superuserPermission.id,
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID
    },
  });

  await prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: userRole.id, permissionId: basicPermission.id } },
    update: {},
    create: {
      roleId: userRole.id,
      permissionId: basicPermission.id,
      createdBy: SYSTEM_USER_ID,
      updatedBy: SYSTEM_USER_ID
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
