'use client';

import { useEffect, useState } from 'react';
import { toursApi, bookingsApi, usersApi } from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { TrendingUp, Users, Map, DollarSign, CalendarCheck, ArrowUpRight, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface KPI {
  label: string;
  value: string | number;
  change: string;
  icon: any;
  color: string;
  bg: string;
}

const SkeletonCard = () => (
  <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-6 animate-pulse">
    <div className="flex justify-between mb-4">
      <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      <div className="w-16 h-6 rounded-lg bg-slate-200 dark:bg-slate-800" />
    </div>
    <div className="w-32 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg mb-2" />
    <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
  </div>
);

export default function AdminDashboard() {
  const [tours, setTours] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [t, b, u] = await Promise.allSettled([
          toursApi.list(),
          bookingsApi.list(),
          usersApi.list(),
        ]);
        if (t.status === 'fulfilled') setTours(t.value.data || []);
        if (b.status === 'fulfilled') {
          const bData = Array.isArray(b.value.data) ? b.value.data : [];
          setBookings(bData);
        }
        if (u.status === 'fulfilled') {
          const uData = Array.isArray(u.value.data) ? u.value.data : [];
          setUserCount(uData.length);
        }
      } catch {} finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  const totalRevenue = bookings.reduce((s: number, b: any) => s + (b.totalPrice || 0), 0);
  const confirmedBookings = bookings.filter((b: any) => b.status === 'CONFIRMED').length;

  // Calculate real revenue by month from bookings
  const revenueByMonth = bookings.reduce((acc: Record<string, { revenue: number; count: number }>, b: any) => {
    const date = b.bookingDate || b.createdAt || '';
    const month = date.substring(5, 7); // Extract month
    const key = `Tháng ${parseInt(month) || 0}`;
    if (!acc[key]) acc[key] = { revenue: 0, count: 0 };
    acc[key].revenue += (b.totalPrice || 0);
    acc[key].count += 1;
    return acc;
  }, {});

  const revenueChart = Object.entries(revenueByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      revenue: Math.round((data as any).revenue / 1000000),
      bookings: (data as any).count,
    }));

  const kpis: KPI[] = [
    { label: 'Tổng Doanh Thu', value: new Intl.NumberFormat('vi-VN').format(totalRevenue) + 'đ', change: `+${bookings.length} đơn`, icon: DollarSign, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
    { label: 'Tour Đang Hoạt Động', value: tours.length, change: 'Khai thác', icon: Map, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { label: 'Tổng Đặt Tour', value: bookings.length, change: `${confirmedBookings} xác nhận`, icon: CalendarCheck, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10' },
    { label: 'Người Dùng', value: userCount, change: 'Tài khoản', icon: Users, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
  ];

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tổng Quan</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Theo dõi hoạt động kinh doanh và hiệu suất</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {loading ? (
          <>
            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
          </>
        ) : (
          kpis.map((k) => (
            <div key={k.label} className="group relative bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent dark:from-white/5 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={`p-3 rounded-2xl ${k.bg}`}>
                  <k.icon className={`w-6 h-6 ${k.color}`} />
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  {k.change}
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{k.value}</p>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{k.label}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Area Chart */}
        <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Doanh Thu Theo Tháng</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Đơn vị: Triệu VNĐ</p>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={18} />
            </div>
          </div>
          {loading ? (
            <div className="h-[280px] w-full bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse" />
          ) : revenueChart.length > 0 ? (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" className="dark:stroke-slate-800/60" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, color: '#fff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: '#fff', fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              Chưa có dữ liệu doanh thu
            </div>
          )}
        </div>

        {/* Bar Chart */}
        <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Lượt Đặt Tour</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Số lượng booking theo tháng</p>
            </div>
            <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <CalendarCheck size={18} />
            </div>
          </div>
          {loading ? (
            <div className="h-[280px] w-full bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse" />
          ) : revenueChart.length > 0 ? (
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" className="dark:stroke-slate-800/60" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                    contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, color: '#fff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: '#fff', fontWeight: 600 }}
                  />
                  <Bar dataKey="bookings" fill="#8b5cf6" radius={[6, 6, 6, 6]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              Chưa có dữ liệu booking
            </div>
          )}
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Đặt Tour Gần Đây</h3>
          <Link href="/admin/bookings" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1">
            Xem tất cả <ArrowRight size={16} />
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-full h-14 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <CalendarCheck size={40} className="text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">Chưa có booking nào</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/5">
                  <th className="pb-4 font-semibold px-4">#ID</th>
                  <th className="pb-4 font-semibold px-4">Khách Hàng</th>
                  <th className="pb-4 font-semibold px-4">Tour</th>
                  <th className="pb-4 font-semibold px-4">Ngày Đặt</th>
                  <th className="pb-4 font-semibold px-4">Trạng Thái</th>
                  <th className="pb-4 font-semibold px-4 text-right">Tổng Tiền</th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 6).map((b: any) => {
                  let statusColor = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
                  if (b.status === 'CONFIRMED') statusColor = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400';
                  else if (b.status === 'PENDING') statusColor = 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400';
                  else if (b.status === 'CANCELLED') statusColor = 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400';
                  else if (b.status === 'COMPLETED') statusColor = 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400';

                  return (
                    <tr key={b.id} className="group border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-4 text-slate-500 dark:text-slate-400 font-mono">#{b.id}</td>
                      <td className="py-4 px-4 text-slate-900 dark:text-white font-medium">{b.contactName || `User #${b.userId}`}</td>
                      <td className="py-4 px-4 text-slate-600 dark:text-slate-300 max-w-[200px] truncate" title={b.tourTitle}>{b.tourTitle || `Tour #${b.tourId}`}</td>
                      <td className="py-4 px-4 text-slate-500 dark:text-slate-400">{b.bookingDate?.split('T')[0]}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${statusColor}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className="font-bold text-slate-900 dark:text-white">{fmt(b.totalPrice || 0)}</span>
                        <span className="text-slate-500 dark:text-slate-400 ml-1">đ</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
