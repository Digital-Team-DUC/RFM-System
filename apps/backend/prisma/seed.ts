import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- START SEEDING REAL ESTATE & FINANCIAL MANAGEMENT SYSTEM ---');

  // 1. Organization
  const org = await prisma.organization.upsert({
    where: { code: 'PPLAD' },
    update: {},
    create: {
      name: 'Phnom Penh Land & Asset Development Co., Ltd.',
      code: 'PPLAD',
      taxNumber: 'K009-876543210',
      address: 'Preah Monivong Blvd, Sangkat Boeung Keng Kang 1, Khan Chamkarmon, Phnom Penh, Cambodia',
      phone: '+855 23 999 888',
      email: 'info@pplad-realestate.com',
      currency: 'USD',
      settings: {
        defaultTimezone: 'Asia/Phnom_Penh',
        secondaryCurrency: 'KHR',
        khrExchangeRate: 4100,
        fiscalYearStart: '01-01',
      },
    },
  });
  console.log(`[Seed] Organization ready: ${org.name} (${org.id})`);

  // 2. Permissions
  const permissionsList = [
    { code: 'properties.read', description: 'View properties and master plans', module: 'properties' },
    { code: 'properties.create', description: 'Create new property listings', module: 'properties' },
    { code: 'properties.update', description: 'Update properties and master plans', module: 'properties' },
    { code: 'properties.delete', description: 'Delete property records', module: 'properties' },
    { code: 'projects.manage', description: 'Manage project portfolios and budgets', module: 'projects' },
    { code: 'crm.read', description: 'View customers and leads', module: 'crm' },
    { code: 'crm.manage', description: 'Create and update leads and viewings', module: 'crm' },
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
    { name: 'SUPER_ADMIN', desc: 'Full unrestricted system access', perms: allPerms.map((p) => p.id) },
    {
      name: 'COMPANY_ADMIN',
      desc: 'Company leadership & executive operations',
      perms: allPerms.filter((p) => p.code !== 'accounting.close').map((p) => p.id),
    },
    {
      name: 'PROJECT_MANAGER',
      desc: 'Manage projects, budgets, inventory, and construction milestones',
      perms: allPerms
        .filter((p) => p.module === 'properties' || p.module === 'projects' || p.code === 'expenses.create')
        .map((p) => p.id),
    },
    {
      name: 'SALES_MANAGER',
      desc: 'Oversee CRM, sales agents, bookings, contracts, and approve discounts',
      perms: allPerms
        .filter(
          (p) =>
            ['crm', 'sales', 'contracts', 'commissions'].includes(p.module) ||
            ['properties.read', 'properties.update', 'payments.receive', 'reports.export'].includes(p.code)
        )
        .map((p) => p.id),
    },
    {
      name: 'SALES_AGENT',
      desc: 'Manage leads, property viewings, customer registrations, and initial bookings',
      perms: allPerms
        .filter((p) => ['properties.read', 'crm.read', 'crm.manage', 'sales.create'].includes(p.code))
        .map((p) => p.id),
    },
    {
      name: 'ACCOUNTANT',
      desc: 'Manage chart of accounts, journal entries, financial statements, and commission audits',
      perms: allPerms
        .filter(
          (p) =>
            ['accounting', 'finance', 'reports'].includes(p.module) ||
            [
              'payments.receive',
              'payments.verify',
              'contracts.manage',
              'commissions.approve',
              'crm.read',
              'properties.read',
            ].includes(p.code)
        )
        .map((p) => p.id),
    },
    {
      name: 'CASHIER',
      desc: 'Receive customer payments, issue official receipts, and verify bank transaction slips',
      perms: allPerms
        .filter((p) =>
          [
            'payments.receive',
            'payments.verify',
            'properties.read',
            'crm.read',
            'sales.create',
            'bookings.approve',
            'accounting.read',
          ].includes(p.code)
        )
        .map((p) => p.id),
    },
    {
      name: 'AUDITOR',
      desc: 'Read-only access to audit logs, financial ledger, and compliance records',
      perms: allPerms
        .filter((p) => p.code.includes('read') || p.code === 'reports.export')
        .map((p) => p.id),
    },
  ];

  const roleMap: Record<string, string> = {};
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

    // Link permissions
    for (const permId of r.perms) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permId } },
        update: {},
        create: { roleId: role.id, permissionId: permId },
      });
    }
  }
  console.log(`[Seed] Seeded ${rolesConfig.length} system roles with role permissions.`);

  // 4. Initial Users with Role-Matching Credentials
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
      email: 'agent1@rfm.com',
      fullName: 'Sokha Chan',
      khmerName: 'ចាន់ សុខា',
      phone: '+855 70 333 222',
      role: 'SALES_AGENT',
      password: 'Agent123!',
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

  const userMap: Record<string, string> = {};
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
        passwordHash,
        fullName: u.fullName,
        khmerName: u.khmerName,
        phone: u.phone,
        isActive: true,
      },
    });
    userMap[u.email] = user.id;

    // assign role
    const roleId = roleMap[u.role];
    if (roleId) {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: user.id, roleId } },
        update: {},
        create: { userId: user.id, roleId },
      });
    }

    // notification preferences
    await prisma.notificationPreference.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, inApp: true, email: true, telegram: true, sms: false },
    });
  }
  console.log(`[Seed] Seeded ${usersToCreate.length} system users.`);

  // 5. Sales Agent Profile
  await prisma.salesAgent.upsert({
    where: { code: 'AGT-001' },
    update: {},
    create: {
      organizationId: org.id,
      userId: userMap['agent1@rfm.com'],
      code: 'AGT-001',
      fullName: 'Sokha Chan',
      phone: '+855 70 333 222',
      email: 'agent1@rfm.com',
      team: 'CHROY_CHANGVAR_DIRECT',
    },
  });

  // 6. Projects
  const project1 = await prisma.project.upsert({
    where: { code: 'GMR-01' },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Grand Mekong Residence',
      code: 'GMR-01',
      type: 'RESIDENTIAL_DEVELOPMENT',
      status: 'ACTIVE',
      address: 'National Road 6A, Sangkat Chroy Changvar, Khan Chroy Changvar',
      province: 'Phnom Penh',
      district: 'Chroy Changvar',
      latitude: 11.6025,
      longitude: 104.9312,
      totalArea: 45000.0,
      landCost: 12500000.0,
      budget: 35000000.0,
      managerId: userMap['admin@rfm.com'],
      notes: 'Luxury riverfront community featuring single villas, twin villas, and commercial shophouses.',
    },
  });

  const project2 = await prisma.project.upsert({
    where: { code: 'BSS-02' },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Borey Sen Sok Premier',
      code: 'BSS-02',
      type: 'TOWNHOUSE_BOREY',
      status: 'ACTIVE',
      address: 'Street 1986, Sangkat Phnom Penh Thmey, Khan Sen Sok',
      province: 'Phnom Penh',
      district: 'Sen Sok',
      latitude: 11.5831,
      longitude: 104.8819,
      totalArea: 28000.0,
      landCost: 8200000.0,
      budget: 20000000.0,
      managerId: userMap['admin@rfm.com'],
      notes: 'Family living close to international schools and shopping malls.',
    },
  });

  const project3 = await prisma.project.upsert({
    where: { code: 'DLC-03' },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Diamond Island Condominiums',
      code: 'DLC-03',
      type: 'CONDOMINIUM_HIGHRISE',
      status: 'PLANNING',
      address: 'Koh Pich, Sangkat Tonle Bassac, Khan Chamkarmon',
      province: 'Phnom Penh',
      district: 'Chamkarmon',
      latitude: 11.5458,
      longitude: 104.9389,
      totalArea: 12000.0,
      landCost: 18000000.0,
      budget: 45000000.0,
      notes: 'Ultra-modern 35-storey freehold condo towers overlooking the Tonle Sap and Mekong rivers.',
    },
  });
  console.log(`[Seed] Seeded 3 real estate projects: GMR-01, BSS-02, DLC-03.`);

  // 7. Master Plan Assets & Shapes for Grand Mekong Residence
  const masterPlan = await prisma.masterPlanAsset.create({
    data: {
      projectId: project1.id,
      title: 'Grand Mekong Residence - Phase 1 Master Plan',
      width: 1000,
      height: 600,
      svgContent: '<svg viewBox="0 0 1000 600" xmlns="http://www.w3.org/2000/svg"></svg>',
    },
  });

  // 8. Properties
  const propertiesData = [
    {
      projectId: project1.id,
      code: 'GMR-V01',
      unitNumber: 'A-01',
      block: 'Block A',
      zone: 'Zone 1 - Riverfront',
      propertyType: 'VILLA_SINGLE',
      title: 'Royal Mekong Villa A-01',
      landArea: 320.0,
      buildingArea: 410.0,
      bedrooms: 5,
      bathrooms: 6,
      facingDirection: 'EAST',
      acquisitionCost: 110000.0,
      constructionCost: 160000.0,
      listingPrice: 380000.0,
      sellingPrice: 360000.0,
      discountLimit: 20000.0,
      reservationAmount: 5000.0,
      status: 'AVAILABLE',
      shapeCoord: 'M 50 50 L 170 50 L 170 150 L 50 150 Z',
      shapeType: 'path',
    },
    {
      projectId: project1.id,
      code: 'GMR-V02',
      unitNumber: 'A-02',
      block: 'Block A',
      zone: 'Zone 1 - Riverfront',
      propertyType: 'VILLA_SINGLE',
      title: 'Royal Mekong Villa A-02',
      landArea: 320.0,
      buildingArea: 410.0,
      bedrooms: 5,
      bathrooms: 6,
      facingDirection: 'EAST',
      acquisitionCost: 110000.0,
      constructionCost: 160000.0,
      listingPrice: 385000.0,
      sellingPrice: 365000.0,
      discountLimit: 20000.0,
      reservationAmount: 5000.0,
      status: 'RESERVED',
      shapeCoord: 'M 190 50 L 310 50 L 310 150 L 190 150 Z',
      shapeType: 'path',
    },
    {
      projectId: project1.id,
      code: 'GMR-V03',
      unitNumber: 'A-03',
      block: 'Block A',
      zone: 'Zone 1 - Riverfront',
      propertyType: 'VILLA_TWIN',
      title: 'Twin Mekong Villa A-03',
      landArea: 220.0,
      buildingArea: 290.0,
      bedrooms: 4,
      bathrooms: 5,
      facingDirection: 'EAST',
      acquisitionCost: 75000.0,
      constructionCost: 115000.0,
      listingPrice: 260000.0,
      sellingPrice: 245000.0,
      discountLimit: 15000.0,
      reservationAmount: 3000.0,
      status: 'SOLD',
      shapeCoord: 'M 330 50 L 450 50 L 450 150 L 330 150 Z',
      shapeType: 'path',
    },
    {
      projectId: project1.id,
      code: 'GMR-SH01',
      unitNumber: 'SH-01',
      block: 'Block B',
      zone: 'Zone 2 - Boulevard Commercial',
      propertyType: 'SHOPHOUSE',
      title: 'Boulevard Shophouse SH-01',
      landArea: 90.0,
      buildingArea: 240.0,
      bedrooms: 4,
      bathrooms: 5,
      facingDirection: 'SOUTH',
      acquisitionCost: 45000.0,
      constructionCost: 85000.0,
      listingPrice: 195000.0,
      sellingPrice: 185000.0,
      discountLimit: 10000.0,
      reservationAmount: 2000.0,
      status: 'INSTALLMENT',
      shapeCoord: 'M 50 200 L 150 200 L 150 320 L 50 320 Z',
      shapeType: 'path',
    },
    {
      projectId: project1.id,
      code: 'GMR-SH02',
      unitNumber: 'SH-02',
      block: 'Block B',
      zone: 'Zone 2 - Boulevard Commercial',
      propertyType: 'SHOPHOUSE',
      title: 'Boulevard Shophouse SH-02',
      landArea: 90.0,
      buildingArea: 240.0,
      bedrooms: 4,
      bathrooms: 5,
      facingDirection: 'SOUTH',
      acquisitionCost: 45000.0,
      constructionCost: 85000.0,
      listingPrice: 195000.0,
      sellingPrice: 190000.0,
      discountLimit: 10000.0,
      reservationAmount: 2000.0,
      status: 'AVAILABLE',
      shapeCoord: 'M 170 200 L 270 200 L 270 320 L 170 320 Z',
      shapeType: 'path',
    },
    {
      projectId: project2.id,
      code: 'BSS-L01',
      unitNumber: 'P-101',
      block: 'Block C',
      zone: 'Zone Land',
      propertyType: 'LAND_PLOT',
      title: 'Prime Residential Land Plot P-101',
      landArea: 200.0,
      buildingArea: 0.0,
      bedrooms: 0,
      bathrooms: 0,
      facingDirection: 'NORTH',
      acquisitionCost: 40000.0,
      constructionCost: 0.0,
      listingPrice: 98000.0,
      sellingPrice: 95000.0,
      discountLimit: 3000.0,
      reservationAmount: 2000.0,
      status: 'AVAILABLE',
      shapeCoord: 'M 300 200 L 420 200 L 420 320 L 300 320 Z',
      shapeType: 'path',
    },
  ];

  const propertyMap: Record<string, string> = {};
  for (const p of propertiesData) {
    const { shapeCoord, shapeType, ...propFields } = p;
    const property = await prisma.property.upsert({
      where: { code: p.code },
      update: { ...propFields },
      create: { ...propFields },
    });
    propertyMap[p.code] = property.id;

    // Attach master plan shape
    await prisma.masterPlanShape.create({
      data: {
        assetId: masterPlan.id,
        propertyId: property.id,
        shapeType: shapeType,
        coordinates: shapeCoord,
        label: p.unitNumber || p.code,
        status: p.status,
        colorCode:
          p.status === 'AVAILABLE'
            ? '#10b981'
            : p.status === 'RESERVED'
            ? '#f59e0b'
            : p.status === 'INSTALLMENT'
            ? '#3b82f6'
            : '#ef4444',
      },
    });
  }
  console.log(`[Seed] Seeded ${propertiesData.length} properties with interactive master plan shapes.`);

  // 9. Customers
  const customer1 = await prisma.customer.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      organizationId: org.id,
      fullName: 'Bunly Meas',
      khmerName: 'មាស ប៊ុនលី',
      phone: '+855 12 345 678',
      email: 'bunly.meas@gmail.com',
      address: '#45, St. 271, Sangkat Phsar Doeum Thkov, Khan Chamkarmon, Phnom Penh',
      customerType: 'INDIVIDUAL',
      idType: 'NATIONAL_ID',
      idNumber: '010998877',
      assignedAgentId: userMap['agent1@rfm.com'],
      notes: 'High net worth business owner interested in riverfront residential investments.',
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      organizationId: org.id,
      fullName: 'Sreyneang Chea',
      khmerName: 'ជា ស្រីនាង',
      phone: '+855 98 765 432',
      email: 'sreyneang.chea@yahoo.com',
      address: '#12, St. 598, Sangkat Toul Sangke, Khan Russey Keo, Phnom Penh',
      customerType: 'INDIVIDUAL',
      idType: 'PASSPORT',
      idNumber: 'N01234567',
      assignedAgentId: userMap['agent1@rfm.com'],
      notes: 'Purchased Boulevard Shophouse SH-01 under 24-month installment plan.',
    },
  });
  console.log(`[Seed] Seeded sample customers: Bunly Meas & Sreyneang Chea.`);

  // 10. CRM Leads & Activities
  const lead1 = await prisma.lead.create({
    data: {
      organizationId: org.id,
      customerId: customer1.id,
      fullName: 'Bunly Meas',
      phone: '+855 12 345 678',
      email: 'bunly.meas@gmail.com',
      stage: 'BOOKING',
      leadSource: 'REFERRAL',
      budgetMin: 300000,
      budgetMax: 400000,
      interestedProperty: 'Grand Mekong Villa A-02',
      assignedAgentId: userMap['agent1@rfm.com'],
    },
  });

  await prisma.leadActivity.createMany({
    data: [
      {
        leadId: lead1.id,
        type: 'CALL',
        summary: 'Introduced Grand Mekong Residence phase 1 villa master plan',
        completedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000),
      },
      {
        leadId: lead1.id,
        type: 'VIEWING',
        summary: 'Conducted on-site plot inspection of Villa A-02',
        completedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
      },
      {
        leadId: lead1.id,
        type: 'NOTE',
        summary: 'Client submitted $5,000 reservation deposit for 14 days reservation',
        completedAt: new Date(),
      },
    ],
  });

  // 11. Booking for Villa A-02
  const booking1 = await prisma.booking.upsert({
    where: { bookingReference: 'BK-2026-001' },
    update: {},
    create: {
      bookingReference: 'BK-2026-001',
      customerId: customer1.id,
      propertyId: propertyMap['GMR-V02'],
      projectId: project1.id,
      agentId: userMap['agent1@rfm.com'],
      expiryDate: new Date(Date.now() + 14 * 24 * 3600 * 1000),
      sellingPrice: 365000.0,
      discount: 20000.0,
      bookingFee: 5000.0,
      depositRequired: 36500.0,
      status: 'APPROVED',
      approvedById: userMap['sales.manager@rfm.com'],
      notes: 'Approved 10% down payment terms; contract signing scheduled for next week.',
    },
  });

  await prisma.deposit.upsert({
    where: { receiptNumber: 'DEP-2026-001' },
    update: {},
    create: {
      bookingId: booking1.id,
      receiptNumber: 'DEP-2026-001',
      amount: 5000.0,
      paymentMethod: 'KHQR_SCAN',
      referenceNumber: 'ABA-TXN-88491023',
      verificationStatus: 'VERIFIED',
      verifiedById: userMap['cashier@rfm.com'],
      notes: 'Verified via ABA Pay QR instant settlement.',
    },
  });

  // 12. Active Contract & Installment Plan for Shophouse SH-01
  const contract1 = await prisma.contract.upsert({
    where: { contractNumber: 'CTR-2026-001' },
    update: {},
    create: {
      contractNumber: 'CTR-2026-001',
      customerId: customer2.id,
      propertyId: propertyMap['GMR-SH01'],
      projectId: project1.id,
      sellingPrice: 185000.0,
      depositPaid: 35000.0,
      balanceRemaining: 150000.0,
      status: 'ACTIVE',
      signedDate: new Date(Date.now() - 45 * 24 * 3600 * 1000),
      transferCondition: 'Transfer hard title upon 100% full payment completion.',
      notes: '24 equal monthly installments of $6,250 each with 7-day grace period.',
    },
  });

  const paymentPlan1 = await prisma.paymentPlan.create({
    data: {
      contractId: contract1.id,
      planType: 'EQUAL_MONTHLY',
      totalPrincipal: 185000.0,
      depositAmount: 35000.0,
      installmentCount: 24,
      frequencyMonths: 1,
      firstDueDate: new Date(Date.now() - 30 * 24 * 3600 * 1000),
      finalDueDate: new Date(Date.now() + 23 * 30 * 24 * 3600 * 1000),
      gracePeriodDays: 7,
      penaltyDailyRate: 0.05,
      penaltyFixedFee: 0,
      penaltyMaxCap: 10.0,
    },
  });

  // Generate installments
  const perInstallment = 6250.0;
  for (let i = 1; i <= 24; i++) {
    const dueDate = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    dueDate.setMonth(dueDate.getMonth() + (i - 1));

    let status = 'UPCOMING';
    let amountPaid = 0.0;
    let outstandingAmount = perInstallment;

    if (i === 1) {
      status = 'PAID';
      amountPaid = perInstallment;
      outstandingAmount = 0.0;
    } else if (i === 2) {
      status = 'PARTIALLY_PAID';
      amountPaid = 3000.0;
      outstandingAmount = 3250.0;
    } else if (i === 3) {
      status = 'DUE';
    }

    const inst = await prisma.installment.create({
      data: {
        paymentPlanId: paymentPlan1.id,
        contractId: contract1.id,
        installmentNumber: i,
        dueDate,
        scheduledAmount: perInstallment,
        amountPaid,
        outstandingAmount,
        status,
      },
    });

    if (i === 1) {
      const payment1 = await prisma.payment.create({
        data: {
          receiptNumber: 'REC-2026-101',
          contractId: contract1.id,
          customerId: customer2.id,
          amount: perInstallment,
          currency: 'USD',
          paymentMethod: 'BANK_TRANSFER',
          transactionRef: 'CANADIA-FT-991024',
          paymentDate: new Date(Date.now() - 28 * 24 * 3600 * 1000),
          receivedById: userMap['cashier@rfm.com'],
          verificationStatus: 'VERIFIED',
          verifiedById: userMap['accountant@rfm.com'],
        },
      });
      await prisma.paymentAllocation.create({
        data: {
          paymentId: payment1.id,
          installmentId: inst.id,
          allocatedAmount: perInstallment,
        },
      });
    } else if (i === 2) {
      const payment2 = await prisma.payment.create({
        data: {
          receiptNumber: 'REC-2026-102',
          contractId: contract1.id,
          customerId: customer2.id,
          amount: 3000.0,
          currency: 'USD',
          paymentMethod: 'KHQR_SCAN',
          transactionRef: 'ABA-KHQR-110293',
          paymentDate: new Date(Date.now() - 2 * 24 * 3600 * 1000),
          receivedById: userMap['cashier@rfm.com'],
          verificationStatus: 'VERIFIED',
          verifiedById: userMap['accountant@rfm.com'],
        },
      });
      await prisma.paymentAllocation.create({
        data: {
          paymentId: payment2.id,
          installmentId: inst.id,
          allocatedAmount: 3000.0,
        },
      });
    }
  }
  console.log(`[Seed] Seeded Contract CTR-2026-001 with 24 installments and reconciled payments.`);

  // 13. Financial Accounts
  const accAba = await prisma.financialAccount.create({
    data: {
      organizationId: org.id,
      name: 'ABA Bank - Master Operations (USD)',
      accountNumber: '001 234 567',
      bankName: 'Advanced Bank of Asia (ABA)',
      accountType: 'BANK',
      currency: 'USD',
      openingBalance: 500000.0,
      currentBalance: 543000.0,
    },
  });

  const accCanadia = await prisma.financialAccount.create({
    data: {
      organizationId: org.id,
      name: 'Canadia Bank - Tax & Escrow (USD)',
      accountNumber: '010 987 654',
      bankName: 'Canadia Bank PLC',
      accountType: 'BANK',
      currency: 'USD',
      openingBalance: 300000.0,
      currentBalance: 300000.0,
    },
  });

  const accCash = await prisma.financialAccount.create({
    data: {
      organizationId: org.id,
      name: 'Head Office Cash Vault',
      accountNumber: 'PETTY-CASH-01',
      bankName: 'Internal Vault',
      accountType: 'CASH',
      currency: 'USD',
      openingBalance: 10000.0,
      currentBalance: 11250.0,
    },
  });

  // 14. Chart of Accounts (COA)
  const coaData = [
    // Assets (1000-1999)
    { code: '1010', name: 'Cash on Hand', accountType: 'ASSET', balance: 11250.0 },
    { code: '1020', name: 'Cash at Bank - ABA Bank USD', accountType: 'ASSET', balance: 543000.0 },
    { code: '1021', name: 'Cash at Bank - Canadia Bank USD', accountType: 'ASSET', balance: 300000.0 },
    { code: '1200', name: 'Accounts Receivable - Property Contracts', accountType: 'ASSET', balance: 140750.0 },
    { code: '1510', name: 'Land Acquisition & Infrastructure Assets', accountType: 'ASSET', balance: 12500000.0 },
    { code: '1520', name: 'Construction Work-In-Progress (WIP)', accountType: 'ASSET', balance: 4200000.0 },
    
    // Liabilities (2000-2999)
    { code: '2010', name: 'Accounts Payable - Contractors & Vendors', accountType: 'LIABILITY', balance: 185000.0 },
    { code: '2100', name: 'Customer Reservation Deposits Liability', accountType: 'LIABILITY', balance: 5000.0 },
    { code: '2150', name: 'Customer Unearned / Deferred Revenue', accountType: 'LIABILITY', balance: 150000.0 },
    { code: '2200', name: 'Accrued Commission Payable', accountType: 'LIABILITY', balance: 5550.0 },

    // Equity (3000-3999)
    { code: '3010', name: 'Paid-in Share Capital', accountType: 'EQUITY', balance: 17000000.0 },
    { code: '3020', name: 'Retained Earnings', accountType: 'EQUITY', balance: 300000.0 },

    // Revenue (4000-4999)
    { code: '4010', name: 'Property Sales Revenue Recognized', accountType: 'REVENUE', balance: 220000.0 },
    { code: '4020', name: 'Interest & Late Penalty Fee Income', accountType: 'REVENUE', balance: 450.0 },

    // Expenses (5000-6999)
    { code: '5010', name: 'Cost of Property Sales (COGS)', accountType: 'EXPENSE', balance: 130000.0 },
    { code: '6010', name: 'Sales Agent Commission Expense', accountType: 'EXPENSE', balance: 5550.0 },
    { code: '6020', name: 'Marketing, Advertising & Billboard Expense', accountType: 'EXPENSE', balance: 18500.0 },
    { code: '6030', name: 'Salaries, Allowances & Benefits', accountType: 'EXPENSE', balance: 32000.0 },
    { code: '6040', name: 'Legal, Licensing & Land Title Transfer Fees', accountType: 'EXPENSE', balance: 9500.0 },
    { code: '6050', name: 'Office Utilities, Rent & Tech Infrastructure', accountType: 'EXPENSE', balance: 4950.0 },
  ];

  const coaMap: Record<string, string> = {};
  for (const acc of coaData) {
    const created = await prisma.chartOfAccount.upsert({
      where: { code: acc.code },
      update: { name: acc.name, accountType: acc.accountType, balance: acc.balance },
      create: {
        organizationId: org.id,
        code: acc.code,
        name: acc.name,
        accountType: acc.accountType,
        isSystem: true,
        balance: acc.balance,
      },
    });
    coaMap[acc.code] = created.id;
  }
  console.log(`[Seed] Seeded ${coaData.length} balanced Chart of Accounts.`);

  // 15. Double-Entry Balanced Journal Entries
  // Entry 1: Initial Customer Reservation Deposit
  const je1 = await prisma.journalEntry.create({
    data: {
      organizationId: org.id,
      entryNumber: 'JE-2026-0001',
      description: 'Customer deposit received for Villa A-02 reservation (BK-2026-001)',
      reference: 'DEP-2026-001',
      sourceEntity: 'Booking',
      sourceId: booking1.id,
      isPosted: true,
      postedAt: new Date(),
      createdById: userMap['accountant@rfm.com'],
      lines: {
        create: [
          {
            accountId: coaMap['1020'], // Dr Bank ABA
            debit: 5000.0,
            credit: 0.0,
            description: 'Cash received via ABA Pay QR',
          },
          {
            accountId: coaMap['2100'], // Cr Customer Reservation Deposits
            debit: 0.0,
            credit: 5000.0,
            description: 'Liability for refundable/deductible reservation deposit',
          },
        ],
      },
    },
  });

  // Entry 2: Contract Execution & Down Payment Allocation
  const je2 = await prisma.journalEntry.create({
    data: {
      organizationId: org.id,
      entryNumber: 'JE-2026-0002',
      description: 'Contract CTR-2026-001 down payment and installment collection posting',
      reference: 'CTR-2026-001',
      sourceEntity: 'Contract',
      sourceId: contract1.id,
      isPosted: true,
      postedAt: new Date(),
      createdById: userMap['accountant@rfm.com'],
      lines: {
        create: [
          {
            accountId: coaMap['1020'], // Dr Bank ABA ($35,000 down payment + $9,250 collections = $44,250)
            debit: 44250.0,
            credit: 0.0,
            description: 'Total verified funds collected into bank',
          },
          {
            accountId: coaMap['1200'], // Dr Accounts Receivable balance outstanding ($140,750)
            debit: 140750.0,
            credit: 0.0,
            description: 'Remaining contract receivable installments',
          },
          {
            accountId: coaMap['4010'], // Cr Recognized Sales Revenue ($35,000 initial)
            debit: 0.0,
            credit: 35000.0,
            description: 'Initial down payment milestone revenue recognized',
          },
          {
            accountId: coaMap['2150'], // Cr Deferred Revenue ($150,000 unearned installment balance)
            debit: 0.0,
            credit: 150000.0,
            description: 'Deferred installment contract consideration',
          },
        ],
      },
    },
  });
  console.log(`[Seed] Seeded balanced journal entries JE-2026-0001 (Sum: $5k/$5k) and JE-2026-0002 (Sum: $185k/$185k).`);

  // 16. Commission Policy & Calculation
  const commissionPolicy = await prisma.commissionPolicy.create({
    data: {
      organizationId: org.id,
      name: 'Standard Direct Sales Commission (3%)',
      ratePercent: 3.0,
      calculationBasis: 'NET_SELLING_PRICE',
      eligibilityMilestone: 'DOWN_PAYMENT_VERIFIED',
    },
  });

  const agentRecord = await prisma.salesAgent.findFirst({ where: { code: 'AGT-001' } });
  if (agentRecord) {
    await prisma.commissionCalculation.create({
      data: {
        contractId: contract1.id,
        agentId: agentRecord.id,
        policyId: commissionPolicy.id,
        basisAmount: 185000.0,
        ratePercent: 3.0,
        calculatedAmount: 5550.0,
        approvedAmount: 5550.0,
        paidAmount: 2500.0,
        status: 'PARTIALLY_PAID',
        approvedById: userMap['sales.manager@rfm.com'],
      },
    });
  }

  // 17. Expenses & Approvals
  const expensesData = [
    {
      projectId: project1.id,
      expenseNumber: 'EXP-2026-001',
      category: 'CONSTRUCTION',
      amount: 45000.0,
      currency: 'USD',
      vendorName: 'Mekong Steel & Concrete Co., Ltd.',
      description: 'Foundation piling and reinforced concrete for Block B shophouses',
      status: 'APPROVED',
      requestedById: userMap['admin@rfm.com'],
      approvedById: userMap['admin@rfm.com'],
    },
    {
      projectId: project1.id,
      expenseNumber: 'EXP-2026-002',
      category: 'MARKETING',
      amount: 4500.0,
      currency: 'USD',
      vendorName: 'Angkor Media & Signboard Agency',
      description: 'Chroy Changvar Bridge Highway billboard advertisement campaign',
      status: 'APPROVED',
      requestedById: userMap['sales.manager@rfm.com'],
      approvedById: userMap['admin@rfm.com'],
    },
    {
      projectId: project2.id,
      expenseNumber: 'EXP-2026-003',
      category: 'LEGAL',
      amount: 3200.0,
      currency: 'USD',
      vendorName: 'Phnom Penh Legal Partners',
      description: 'Master Cadastral land title demarcation and subdivision review',
      status: 'PENDING_APPROVAL',
      requestedById: userMap['accountant@rfm.com'],
    },
  ];

  for (const exp of expensesData) {
    await prisma.expense.upsert({
      where: { expenseNumber: exp.expenseNumber },
      update: {},
      create: exp,
    });
  }
  console.log(`[Seed] Seeded expenses EXP-2026-001, 002, 003.`);

  // 18. System Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: userMap['admin@rfm.com'],
        title: 'New Reservation Approved',
        message: 'Villa A-02 was successfully reserved by Bunly Meas with $5,000 deposit.',
        type: 'SUCCESS',
        link: '/sales/bookings',
      },
      {
        userId: userMap['accountant@rfm.com'],
        title: 'Payment Verification Required',
        message: 'Installment #2 partial payment ($3,000) receipt REC-2026-102 verified.',
        type: 'INFO',
        link: '/payments',
      },
      {
        userId: userMap['sales.manager@rfm.com'],
        title: 'Upcoming Installment Due',
        message: 'Contract CTR-2026-001 Installment #3 is due in 5 days.',
        type: 'WARNING',
        link: '/payments/installments',
      },
    ],
  });

  console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
