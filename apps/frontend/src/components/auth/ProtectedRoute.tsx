import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  permission?: string | string[];
  role?: string | string[];
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ permission, role, children }) => {
  const { user, hasPermission, hasRole } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const permitted = permission ? hasPermission(permission) : true;
  const roleOk = role ? hasRole(role) : true;

  if (!permitted || !roleOk) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4 shadow-xl shadow-rose-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
          Your current role{' '}
          <span className="font-mono text-amber-400 font-semibold">
            [{user.roles?.join(', ')}]
          </span>{' '}
          does not have the required permissions to access this module.
        </p>
        <a
          href="/"
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition border border-slate-700"
        >
          Return to Dashboard
        </a>
      </div>
    );
  }

  return <>{children}</>;
};
