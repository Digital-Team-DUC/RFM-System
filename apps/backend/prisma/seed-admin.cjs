const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING ADMIN & ROLES (PURE JS) ---');

  // 1. Organization
  let org = await prisma.organization.findFirst();
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'RFM Enterprise Co., Ltd.',
        currency: 'USD',
        country: 'Cambodia',
        timezone: 'Asia/Phnom_Penh',
      },
    });
    console.log('[Seed] Created default organization:', org.name);
  } else {
    console.log('[Seed] Using existing organization:', org.name);
  }

  // 2. Permissions
  const permissionsList = [
    { code: 'properties.read', description: 'View real estate inventory and plots', module: 'properties' },
    { code: 'properties.create', description: 'Add new properties and land blocks', module: 'properties' },
    { code: 'properties.update', description: 'Modify pricing, dimensions and status', module: 'properties' },
    { code: 'properties.delete', description: 'Remove properties', module: 'properties' },
    { code: 'crm.read', description: 'View leads and customer profiles', module: 'crm' },
    { code: 'crm.manage', description: 'Create and update leads, follow-ups and notes', module: 'crm' },
    { code: 'sales.create', description: 'Create bookings and sales proposals', module: 'sales' },
    { code: 'bookings.approve', description: 'Approve or reject customer reservations', module: 'sales' },
    { code: 'bookings.cancel', description: 'Cancel bookings and release properties', module: 'sales' },
    { code: 'contracts.manage', description: 'Draft and generate contracts', module: 'contracts' },
    { code: 'contracts.approve', description: 'Approve legally binding sales contracts', module: 'contracts' },
    { code: 'payments.receive', description: 'Record payments and issue receipts', module: 'payments' },
    { code: 'payments.verify', description: 'Verify bank transfers and QR payments', module: 'payments' },
    { code: 'payments.refund', description: 'Authorize refunds and reversals', module: 'payments' },
    { code: 'expenses.create', description: 'Submit expense requests and vendor invoices', module: 'finance' },
    { code: 'expenses.approve', description: 'Approve operating expenses and contractor payouts', module: 'finance' },
    { code: 'commissions.manage', description: 'Configure commission policies and calculate accruals', module: 'commissions' },
    { code: 'commissions.approve', description: 'Approve agent commission payouts', module: 'commissions' },
    { code: 'accounting.read', description: 'View general ledger, COA and financial reports', module: 'accounting' },
    { code: 'accounting.post', description: 'Post and adjust double-entry journal entries', module: 'accounting' },
    { code: 'accounting.close', description: 'Close fiscal periods', module: 'accounting' },
    { code: 'reports.export', description: 'Export financial and audit data', module: 'reports' },
    { code: 'users.manage', description: 'Manage staff, roles, and project access', module: 'admin' },
    { code: 'settings.manage', description: 'Configure organization and system settings', module: 'admin' },
    { code: 'audit.read', description: 'Inspect immutable audit logs', module: 'admin' },
  ];

  for (const p of permissionsList) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: { description: p.description, module: p.module },
      create: p,
    });
  }
  const allPerms = await prisma.permission.findMany();
  console.log(`[Seed] Seeded ${allPerms.length} system permissions.`);

  // 3. Roles
  const rolesConfig = [
    { name: 'SUPER_ADMIN', desc: 'Full unrestricted system access', perms: allPerms.map(p => p.id) },
    { name: 'SALES_MANAGER', desc: 'Oversee CRM, sales agents, bookings, contracts', perms: allPerms.filter(p => p.module === 'properties' || p.module === 'crm' || p.module === 'sales' || p.module === 'contracts').map(p => p.id) },
    { name: 'ACCOUNTANT', desc: 'Senior financial accountant', perms: allPerms.filter(p => p.module === 'accounting' || p.module === 'finance' || p.module === 'payments').map(p => p.id) },
    { name: 'CASHIER', desc: 'Head cashier', perms: allPerms.filter(p => p.module === 'payments').map(p => p.id) },
  ];

  const roleMap = {};
  for (const r of rolesConfig) {
    let role = await prisma.role.findFirst({
      where: { organizationId: org.id, name: r.name },
    });
    if (!role) {
      role = await prisma.role.create({
        data: {
          organizationId: org.id,
          name: r.name,
          description: r.desc,
          isSystem: true,
        },
      });
    }
    roleMap[r.name] = role.id;

    for (const permId of r.perms) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permId } },
        update: {},
        create: { roleId: role.id, permissionId: permId },
      });
    }
  }
  console.log(`[Seed] Seeded ${rolesConfig.length} system roles.`);

  // 4. Initial Users
  const usersToCreate = [
    {
      email: 'admin@rfm.com',
      fullName: 'Sophea Rattanak',
      khmerName: 'រតនៈ សុភា',
      phone: '+855 12 888 777',
      role: 'SUPER_ADMIN',
      password: 'Admin123!',
    },
    {
      email: 'sales.manager@rfm.com',
      fullName: 'Kimlong Heng',
      khmerName: 'ហេង គីមឡុង',
      phone: '+855 17 555 444',
      role: 'SALES_MANAGER',
      password: 'Sales123!',
    },
    {
      email: 'accountant@rfm.com',
      fullName: 'Vannak Pich',
      khmerName: 'ពេជ្រ វណ្ណៈ',
      phone: '+855 92 111 000',
      role: 'ACCOUNTANT',
      password: 'Account123!',
    },
    {
      email: 'cashier@rfm.com',
      fullName: 'Dara Sam',
      khmerName: 'សំ ដារ៉ា',
      phone: '+855 89 222 111',
      role: 'CASHIER',
      password: 'Cashier123!',
    },
  ];

  for (const u of usersToCreate) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        fullName: u.fullName,
        khmerName: u.khmerName,
        phone: u.phone,
        passwordHash,
        isActive: true,
      },
      create: {
        organizationId: org.id,
        email: u.email,
        fullName: u.fullName,
        khmerName: u.khmerName,
        phone: u.phone,
        passwordHash,
        isActive: true,
      },
    });

    const roleId = roleMap[u.role];
    if (roleId) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId } },
        update: {},
        create: { userId: user.id, roleId },
      });
    }
    console.log(`[Seed] User ready: ${u.email} (Role: ${u.role})`);
  }

  console.log('--- ADMIN SEEDING COMPLETED SUCCESSFULLY ---');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

