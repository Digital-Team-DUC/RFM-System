import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from './common/common.module';
import { EventsModule } from './events/events.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { PropertiesModule } from './properties/properties.module';
import { MasterPlanModule } from './master-plan/master-plan.module';
import { CrmModule } from './crm/crm.module';
import { BookingsModule } from './bookings/bookings.module';
import { ContractsModule } from './contracts/contracts.module';
import { PaymentsModule } from './payments/payments.module';
import { CommissionsModule } from './commissions/commissions.module';
import { FinanceModule } from './finance/finance.module';
import { AccountingModule } from './accounting/accounting.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UsersModule } from './users/users.module';
import { AuditModule } from './audit/audit.module';
import { DocumentsModule } from './documents/documents.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    EventsModule,
    AuthModule,
    ProjectsModule,
    PropertiesModule,
    MasterPlanModule,
    CrmModule,
    BookingsModule,
    ContractsModule,
    PaymentsModule,
    CommissionsModule,
    FinanceModule,
    AccountingModule,
    DashboardModule,
    NotificationsModule,
    UsersModule,
    AuditModule,
    DocumentsModule,
  ],
})
export class AppModule {}
