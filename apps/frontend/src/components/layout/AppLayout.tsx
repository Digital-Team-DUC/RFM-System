import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const AppLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer automatically whenever route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400 p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-white p-2 shadow-2xl shadow-emerald-500/20 border border-slate-700/50 flex items-center justify-center overflow-hidden">
              <img src="/rfm-logo.png" alt="RFM System" className="w-full h-full object-contain" />
            </div>
            <div className="absolute -inset-2 rounded-3xl border-2 border-emerald-500/40 border-t-emerald-400 animate-spin pointer-events-none" />
          </div>
          <span className="text-sm font-medium tracking-wide text-slate-300">Initializing RFM System...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-slate-950 text-slate-100 print:bg-white print:text-slate-950 print:block print:min-h-0 print:h-auto">
      {/* Sidebar - Desktop sticky + Mobile/Tablet slide-over drawer */}
      <div className="print:hidden">
        <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 w-full print:block print:w-full print:m-0 print:p-0">
        {/* Top Navbar - completely hidden when printing */}
        <div className="print:hidden">
          <Navbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        </div>

        {/* Main Content Area - responsive padding for phone, tablet, and desktop */}
        <main className="flex-1 p-3 sm:p-5 lg:p-6 overflow-x-hidden overflow-y-auto print:p-0 print:m-0 print:overflow-visible print:w-full print:block">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
