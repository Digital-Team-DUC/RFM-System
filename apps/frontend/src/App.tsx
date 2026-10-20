import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { MasterPlan } from './pages/MasterPlan';
import { Properties } from './pages/Properties';
import { CrmLeads } from './pages/CrmLeads';
import { Customers } from './pages/Customers';
import { CustomerDetail } from './pages/CustomerDetail';
import { Bookings } from './pages/Bookings';
import { Contracts } from './pages/Contracts';
import { Payments } from './pages/Payments';
import { Commissions } from './pages/Commissions';
import { Expenses } from './pages/Expenses';
import { BankAccounts } from './pages/BankAccounts';
import { ChartOfAccounts } from './pages/ChartOfAccounts';
import { JournalEntries } from './pages/JournalEntries';
import { FinancialStatements } from './pages/FinancialStatements';
import { UsersManagement } from './pages/UsersManagement';
import { AuditLogs } from './pages/AuditLogs';
import { SystemSettings } from './pages/SystemSettings';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="projects" element={<Projects />} />
              <Route path="master-plan" element={<MasterPlan />} />
              <Route path="properties" element={<Properties />} />
              <Route path="crm/leads" element={<CrmLeads />} />
              <Route path="crm/customers" element={<Customers />} />
              <Route path="crm/customers/:id" element={<CustomerDetail />} />
              <Route path="sales/bookings" element={<Bookings />} />
              <Route path="sales/contracts" element={<Contracts />} />
              <Route path="payments" element={<Payments />} />
              <Route path="commissions" element={<Commissions />} />
              <Route path="finance/expenses" element={<Expenses />} />
              <Route path="finance/accounts" element={<BankAccounts />} />
              <Route path="accounting/coa" element={<ChartOfAccounts />} />
              <Route path="accounting/journal" element={<JournalEntries />} />
              <Route path="accounting/statements" element={<FinancialStatements />} />
              <Route path="admin/users" element={<UsersManagement />} />
              <Route path="admin/audit" element={<AuditLogs />} />
              <Route path="admin/settings" element={<SystemSettings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
