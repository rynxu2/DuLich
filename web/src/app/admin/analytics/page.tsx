'use client';

import { useEffect, useState } from 'react';
import { analyticsApi, bookingsApi } from '@/lib/api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#ec4899'];

export default function AnalyticsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await bookingsApi.list();
        setBookings(Array.isArray(data) ? data : []);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  // Calculate revenue by month
  const revenueByMonth = bookings.reduce((acc: Record<string, number>, b: any) => {
    const month = b.bookingDate?.substring(0, 7) || 'N/A';
    acc[month] = (acc[month] || 0) + (b.totalPrice || 0);
    return acc;
  }, {});

  const revenueChart = Object.entries(revenueByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, revenue]) => ({ month, revenue: Math.round(revenue / 1000000) }));

  // Status distribution
  const statusDist = bookings.reduce((acc: Record<string, number>, b: any) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  const statusChart = Object.entries(statusDist).map(([name, value]) => ({ name, value }));

  // Payment method distribution
  const paymentDist = bookings.reduce((acc: Record<string, number>, b: any) => {
    const method = b.paymentMethod || 'CASH';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {});

  const paymentChart = Object.entries(paymentDist).map(([name, value]) => ({ name, value }));

  const totalRevenue = bookings.reduce((s: number, b: any) => s + (b.totalPrice || 0), 0);
  const avgBookingValue = bookings.length > 0 ? totalRevenue / bookings.length : 0;
  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl"><DollarSign className="w-5 h-5 text-emerald-400" /></div>
            <span className="text-sm text-slate-400">Tổng Doanh Thu</span>
          </div>
          <p className="text-2xl font-bold text-white">{loading ? '...' : fmt(totalRevenue) + 'đ'}</p>
        </div>
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-blue-500/10 rounded-xl"><TrendingUp className="w-5 h-5 text-blue-400" /></div>
            <span className="text-sm text-slate-400">Trung Bình / Booking</span>
          </div>
          <p className="text-2xl font-bold text-white">{loading ? '...' : fmt(avgBookingValue) + 'đ'}</p>
        </div>
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-violet-500/10 rounded-xl"><Wallet className="w-5 h-5 text-violet-400" /></div>
            <span className="text-sm text-slate-400">Tổng Bookings</span>
          </div>
          <p className="text-2xl font-bold text-white">{loading ? '...' : bookings.length}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Chart */}
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Doanh Thu Theo Tháng (triệu đ)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueChart}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, color: '#fff' }} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Pie */}
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Phân Bố Trạng Thái</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={statusChart} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {statusChart.map((_, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Method Bar */}
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Phương Thức Thanh Toán</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={paymentChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, color: '#fff' }} />
              <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
