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

import { ProtectedRoute } from './components/auth/ProtectedRoute';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route
                path="projects"
                element={
                  <ProtectedRoute permission="properties.read">
                    <Projects />
                  </ProtectedRoute>
                }
              />
              <Route
                path="master-plan"
                element={
                  <ProtectedRoute permission="properties.read">
                    <MasterPlan />
                  </ProtectedRoute>
                }
              />
              <Route
                path="properties"
                element={
                  <ProtectedRoute permission="properties.read">
                    <Properties />
                  </ProtectedRoute>
                }
              />
              <Route
                path="crm/leads"
                element={
                  <ProtectedRoute permission="crm.read">
                    <CrmLeads />
                  </ProtectedRoute>
                }
              />
              <Route
                path="crm/customers"
                element={
                  <ProtectedRoute permission="crm.read">
                    <Customers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="crm/customers/:id"
                element={
                  <ProtectedRoute permission="crm.read">
                    <CustomerDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="sales/bookings"
                element={
                  <ProtectedRoute permission={['sales.create', 'bookings.approve']}>
                    <Bookings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="sales/contracts"
                element={
                  <ProtectedRoute permission={['contracts.manage', 'contracts.approve']}>
                    <Contracts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="payments"
                element={
                  <ProtectedRoute permission={['payments.receive', 'payments.verify']}>
                    <Payments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="commissions"
                element={
                  <ProtectedRoute permission={['commissions.manage', 'commissions.approve']}>
                    <Commissions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="finance/expenses"
                element={
                  <ProtectedRoute permission={['expenses.create', 'expenses.approve']}>
                    <Expenses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="finance/accounts"
                element={
                  <ProtectedRoute permission="accounting.read">
                    <BankAccounts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="accounting/coa"
                element={
                  <ProtectedRoute permission="accounting.read">
                    <ChartOfAccounts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="accounting/journal"
                element={
                  <ProtectedRoute permission="accounting.read">
                    <JournalEntries />
                  </ProtectedRoute>
                }
              />
              <Route
                path="accounting/statements"
                element={
                  <ProtectedRoute permission="accounting.read">
                    <FinancialStatements />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/users"
                element={
                  <ProtectedRoute permission="users.manage">
                    <UsersManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/audit"
                element={
                  <ProtectedRoute permission="audit.read">
                    <AuditLogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/settings"
                element={
                  <ProtectedRoute permission="settings.manage">
                    <SystemSettings />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
