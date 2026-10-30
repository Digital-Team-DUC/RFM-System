const { PrismaClient } = require('@prisma/client');

async function clearDemoData() {
  const prisma = new PrismaClient();
  try {
    console.log('--- STARTING DEMO DATA PURGE ---');
    await prisma.$transaction([
      prisma.journalEntryLine.deleteMany({}),
      prisma.journalEntry.deleteMany({}),
      prisma.fiscalPeriod.deleteMany({}),
      prisma.expense.deleteMany({}),
      prisma.incomeRecord.deleteMany({}),
      prisma.paymentAllocation.deleteMany({}),
      prisma.refund.deleteMany({}),
      prisma.deposit.deleteMany({}),
      prisma.payment.deleteMany({}),
      prisma.installment.deleteMany({}),
      prisma.paymentPlan.deleteMany({}),
      prisma.commissionPayout.deleteMany({}),
      prisma.commissionCalculation.deleteMany({}),
      prisma.commissionPolicy.deleteMany({}),
      prisma.contract.deleteMany({}),
      prisma.booking.deleteMany({}),
      prisma.propertyViewing.deleteMany({}),
      prisma.leadActivity.deleteMany({}),
      prisma.lead.deleteMany({}),
      prisma.customerDocument.deleteMany({}),
      prisma.customer.deleteMany({}),
      prisma.salesAgent.deleteMany({}),
      prisma.masterPlanShape.deleteMany({}),
      prisma.masterPlanAsset.deleteMany({}),
      prisma.propertyStatusHistory.deleteMany({}),
      prisma.propertyDocument.deleteMany({}),
      prisma.propertyImage.deleteMany({}),
      prisma.property.deleteMany({}),
      prisma.projectMembership.deleteMany({}),
      prisma.project.deleteMany({}),
      prisma.financialAccount.deleteMany({}),
      prisma.notification.deleteMany({}),
      prisma.auditLog.deleteMany({})
    ]);
    console.log('--- ALL DEMO DATA PURGED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Error during demo data purge:', err);
  } finally {
    await prisma.$disconnect();
  }
}

clearDemoData();

