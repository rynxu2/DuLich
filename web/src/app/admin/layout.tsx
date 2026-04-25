'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Map, CalendarCheck, Users, Receipt,
  DollarSign, BarChart3, LogOut, Menu, X, Plane, Star, Bell, UserCheck
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/tours', label: 'Tours', icon: Map },
  { href: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/guides', label: 'Guides', icon: UserCheck },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/expenses', label: 'Expenses', icon: Receipt },
  { href: '/admin/pricing', label: 'Pricing', icon: DollarSign },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/notifications', label: 'Notifications', icon: Bell },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, restore, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { restore(); }, [restore]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push('/login');
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 flex">
      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl
        border-r border-slate-200 dark:border-white/5 flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-200 dark:border-white/5">
          <div className="p-2 bg-blue-50 dark:bg-blue-500/20 rounded-lg"><Plane className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
          <span className="font-bold text-lg text-slate-900 dark:text-white">DuLịch</span>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-slate-600 dark:text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${isActive
                    ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white font-semibold shadow-sm border border-slate-200/50 dark:border-white/5'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/50 dark:hover:bg-white/5'
                  }`}>
                <item.icon size={18} className={isActive ? "text-slate-900 dark:text-white" : ""} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-slate-200 dark:border-white/5">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 bg-blue-50 dark:bg-blue-500/20 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
              {user?.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.username}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.role}</p>
            </div>
          </div>
          <button onClick={() => { logout(); router.push('/login'); }}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition">
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/20 dark:bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 px-6 py-3 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-900 dark:text-white">
            <Menu size={22} />
          </button>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white flex-1">
            {NAV_ITEMS.find((n) => pathname === n.href || (n.href !== '/admin' && pathname.startsWith(n.href)))?.label || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-4 ml-auto">
            <ThemeToggle />
          </div>
        </header>

        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
