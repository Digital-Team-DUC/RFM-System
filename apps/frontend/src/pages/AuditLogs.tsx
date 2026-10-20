import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { ShieldAlert, Clock, User, FileText } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const data = await api.get('/audit');
        setLogs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-white flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-emerald-400" />
          <span>{t('nav.auditLogs')}</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Immutable compliance history recording sensitive financial, booking, and administrative events
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-emerald-400">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center p-12 glass-panel rounded-2xl text-slate-500 text-xs">
          No audit logs recorded yet
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity Type</th>
                <th className="py-3 px-4">Entity ID</th>
                <th className="py-3 px-4 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">
                    {new Date(l.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-white font-semibold">
                    {l.user?.fullName || 'System'}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-800 text-emerald-400">
                      {l.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-300">{l.entityType}</td>
                  <td className="py-2.5 px-4 font-mono text-[10px] text-slate-500">{l.entityId}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-400">
                    {l.ipAddress || '127.0.0.1'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
