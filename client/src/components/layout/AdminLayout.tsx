import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Building2, ClipboardList, TableProperties, FileBarChart2,
  LogOut, Loader2, BarChart3, ChevronDown, Mail, ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/axios';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Companies', path: '/admin/companies', icon: Building2 },
  { name: 'Surveys', path: '/admin/surveys', icon: ClipboardList },
  { name: 'Analysis', path: '/admin/analysis', icon: BarChart3 },
  { name: 'Responses', path: '/admin/responses', icon: TableProperties },
  { name: 'Reports', path: '/admin/reports', icon: FileBarChart2 },
];

interface AdminProfile {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

function AdminProfileMenu({ onLogout }: { onLogout: () => void }) {
  const [open, setOpen] = useState(false);

  const { data: profile } = useQuery<AdminProfile>({
    queryKey: ['admin-me'],
    queryFn: async () => {
      const res = await api.get('/admin/me');
      return res.data.data || res.data;
    },
  });

  const initial = profile?.name?.charAt(0).toUpperCase() || 'A';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-sm ring-1 ring-gray-100">
          {initial}
        </div>
        <div className="hidden sm:block text-left leading-tight">
          <p className="text-sm font-semibold text-gray-800 max-w-[140px] truncate">{profile?.name || 'Admin'}</p>
        </div>
        <ChevronDown size={16} className={`text-gray-400 transition-transform hidden sm:block ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-40"
            >
              <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-lg shadow">
                  {initial}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 truncate">{profile?.name || 'Admin'}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 truncate"><Mail size={11} /> {profile?.email}</p>
                </div>
              </div>
              <div className="p-2">
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400">
                  <ShieldCheck size={14} className="text-blue-500" /> Platform Administrator
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center w-full px-3 py-2.5 mt-1 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium text-sm"
                >
                  <LogOut className="mr-2" size={16} />
                  Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminLayout() {
  const { adminUser: user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Route Guard inside Layout
  React.useEffect(() => {
    if (!isLoading && !user) {
      navigate('/admin/login', { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (!user) return null; // Wait for redirect

  const handleLogout = async () => {
    await logout('admin');
    navigate('/admin/login');
  };

  // Reactive page title — the header used to read window.location directly,
  // which never updated on client-side route changes within this layout.
  const activeNavItem =
    NAV_ITEMS.find((item) => location.pathname.startsWith(item.path)) ??
    (location.pathname.startsWith('/admin/cycles/') ? NAV_ITEMS.find((i) => i.name === 'Analysis') : undefined);
  const pageTitle = activeNavItem?.name
    || (location.pathname.includes('/companies/') ? 'Company Details'
      : location.pathname.includes('/surveys/builder') ? 'Survey Builder'
      : 'Dashboard');

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        className="w-64 bg-white border-r border-gray-100 shadow-sm flex flex-col hidden md:flex z-10"
      >
        <div className="h-16 flex items-center px-6 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center mr-3 shadow-md">
            <span className="text-white font-bold text-lg leading-none">S</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">Survey AI</h1>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = item.name === activeNavItem?.name;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className="relative flex items-center px-4 py-3 rounded-xl transition-colors group"
              >
                {isActive && (
                  <motion.div
                    layoutId="admin-nav-pill"
                    className="absolute inset-0 bg-blue-50 rounded-xl shadow-sm"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <item.icon
                  className={`relative mr-3 transition-transform group-hover:scale-110 ${isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-600'}`}
                  size={20}
                />
                <span className={`relative ${isActive ? 'text-blue-700 font-semibold' : 'text-gray-500 font-medium group-hover:text-gray-700'}`}>
                  {item.name}
                </span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium"
          >
            <LogOut className="mr-3" size={20} />
            Logout
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 z-20">
          <AnimatePresence mode="wait">
            <motion.h2
              key={pageTitle}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
              className="text-xl font-semibold text-gray-800"
            >
              {pageTitle}
            </motion.h2>
          </AnimatePresence>
          <div className="flex items-center space-x-4">
            <AdminProfileMenu onLogout={handleLogout} />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50/50 p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-7xl mx-auto h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
