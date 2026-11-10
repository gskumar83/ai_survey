import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { Loader2, LogOut, ChevronDown, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../lib/axios';

interface EmployeeProfile {
  id: string;
  employee_code: string;
  name: string;
  email: string;
  company: { name: string; logo_url: string | null };
}

function EmployeeProfileMenu({ onLogout }: { onLogout: () => void }) {
  const [open, setOpen] = useState(false);

  const { data: profile } = useQuery<EmployeeProfile>({
    queryKey: ['employee-me'],
    queryFn: async () => {
      const res = await api.get('/employee/me');
      return res.data.data || res.data;
    },
  });

  const initial = profile?.name?.charAt(0).toUpperCase() || 'E';

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
          <p className="text-sm font-semibold text-gray-800 max-w-[140px] truncate">{profile?.name || 'Employee'}</p>
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
                  <p className="font-bold text-gray-900 truncate">{profile?.name || 'Employee'}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 truncate"><Mail size={11} /> {profile?.email}</p>
                </div>
              </div>
              <div className="p-2">
                <div className="flex items-center justify-between px-3 py-2 text-xs text-gray-400">
                  <span>{profile?.company?.name}</span>
                  <span className="font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{profile?.employee_code}</span>
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

export default function EmployeeLayout() {
  const { employeeUser: user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (!isLoading && !user) {
      navigate('/employee/login', { replace: true });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    await logout('employee');
    navigate('/employee/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/employee/dashboard')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-lg leading-none">S</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight hidden sm:block">Survey AI</h1>
            <span className="hidden md:inline text-sm text-gray-400 font-medium border-l border-gray-200 pl-3 ml-1">Employee Portal</span>
          </div>

          <EmployeeProfileMenu onLogout={handleLogout} />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
