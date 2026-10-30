import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { api } from '../../services/api';
import {
  Bell,
  Globe,
  LogOut,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Radio,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, logout, selectedProjectId, setSelectedProjectId } = useAuth();
  const { connected } = useSocket();
  const [projects, setProjects] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await api.get('/projects');
        setProjects(data);
      } catch (e) {
        console.error(e);
      }
    }
    loadProjects();
  }, []);

  useEffect(() => {
    async function loadNotifications() {
      if (user) {
        try {
          const data = await api.get('/notifications');
          setNotifications(data);
        } catch (e) {
          console.error(e);
        }
      }
    }
    loadNotifications();
  }, [user?.id]);

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'km' : 'en';
    i18n.changeLanguage(nextLang);
    localStorage.setItem('rfm_language', nextLang);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Project Selector */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-sm font-medium">
          <Building2 className="w-4 h-4 mr-2" />
          <span>{t('nav.projects')}:</span>
        </div>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
        >
          <option value="">{t('navbar.allProjects')}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} — {p.name}
            </option>
          ))}
        </select>

        {/* Real-time Connection Indicator */}
        <div className="hidden md:flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-slate-400 font-mono">{connected ? t('navbar.liveSync') : t('navbar.offline')}</span>
        </div>
      </div>

      {/* Right Controls: Language, Notifications, User Menu */}
      <div className="flex items-center space-x-4">
        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition"
          title="Switch Language"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span>{i18n.language === 'en' ? 'ភាសាខ្មែរ (KM)' : 'English (EN)'}</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 relative transition"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-500 text-slate-950 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="p-3 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {t('navbar.notifications')}
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-emerald-400 hover:underline font-medium"
                  >
                    {t('navbar.markAllRead')}
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">{t('navbar.noNotifications')}</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs transition ${
                        n.isRead ? 'bg-slate-900 opacity-70' : 'bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {n.type === 'SUCCESS' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : n.type === 'WARNING' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-semibold text-slate-200">{n.title}</p>
                          <p className="text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Logout */}
        <div className="flex items-center space-x-3 pl-3 border-l border-slate-800">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-200 leading-tight">
              {i18n.language === 'km' && user?.khmerName ? user.khmerName : user?.fullName}
            </p>
            <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
              {user?.roles?.[0] || 'User'}
            </span>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 border border-slate-700 transition"
            title={t('actions.logout')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
