'use client';

import { useEffect, useState } from 'react';
import { toursApi, bookingsApi, analyticsApi } from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { TrendingUp, Users, Map, DollarSign, CalendarCheck } from 'lucide-react';

interface KPI {
  label: string;
  value: string;
  change: string;
  icon: any;
  color: string;
  bg: string;
}

const mockRevenue = [
  { month: 'T1', revenue: 45, bookings: 12 },
  { month: 'T2', revenue: 52, bookings: 15 },
  { month: 'T3', revenue: 48, bookings: 13 },
  { month: 'T4', revenue: 61, bookings: 18 },
  { month: 'T5', revenue: 55, bookings: 16 },
  { month: 'T6', revenue: 67, bookings: 21 },
  { month: 'T7', revenue: 73, bookings: 24 },
  { month: 'T8', revenue: 69, bookings: 22 },
  { month: 'T9', revenue: 78, bookings: 26 },
  { month: 'T10', revenue: 82, bookings: 28 },
  { month: 'T11', revenue: 91, bookings: 32 },
  { month: 'T12', revenue: 98, bookings: 35 },
];

export default function AdminDashboard() {
  const [tours, setTours] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [t, b] = await Promise.allSettled([
          toursApi.list(),
          bookingsApi.list(),
        ]);
        if (t.status === 'fulfilled') setTours(t.value.data || []);
        if (b.status === 'fulfilled') setBookings(Array.isArray(b.value.data) ? b.value.data : []);
      } catch {} finally { setLoading(false); }
    };
    fetch();
  }, []);

  const totalRevenue = bookings.reduce((s: number, b: any) => s + (b.totalPrice || 0), 0);
  const confirmedBookings = bookings.filter((b: any) => b.status === 'CONFIRMED').length;

  const kpis: KPI[] = [
    { label: 'Doanh Thu', value: new Intl.NumberFormat('vi-VN').format(totalRevenue) + 'đ', change: '+12.5%', icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Tour Đang Hoạt Động', value: String(tours.length), change: '+3', icon: Map, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Đặt Tour', value: String(bookings.length), change: '+8', icon: CalendarCheck, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Tỉ Lệ Xác Nhận', value: bookings.length > 0 ? Math.round(confirmedBookings / bookings.length * 100) + '%' : '0%', change: '+5%', icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 rounded-xl ${k.bg}`}>
                <k.icon className={`w-5 h-5 ${k.color}`} />
              </div>
              <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">{k.change}</span>
            </div>
            <p className="text-2xl font-bold text-white">{loading ? '...' : k.value}</p>
            <p className="text-sm text-slate-500 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Doanh Thu Theo Tháng (triệu đ)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={mockRevenue}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, color: '#fff' }} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#revenueGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Lượt Đặt Tour Theo Tháng</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={mockRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, color: '#fff' }} />
              <Bar dataKey="bookings" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Đặt Tour Gần Đây</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-white/5">
                <th className="pb-3 font-medium">ID</th>
                <th className="pb-3 font-medium">Khách</th>
                <th className="pb-3 font-medium">Tour</th>
                <th className="pb-3 font-medium">Trạng Thái</th>
                <th className="pb-3 font-medium text-right">Tổng Tiền</th>
              </tr>
            </thead>
            <tbody>
              {bookings.slice(0, 8).map((b: any) => (
                <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="py-3 text-slate-300">#{b.id}</td>
                  <td className="py-3 text-white">{b.contactName || `User ${b.userId}`}</td>
                  <td className="py-3 text-slate-400">{b.tourTitle || `Tour ${b.tourId}`}</td>
                  <td className="py-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium
                      ${b.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-400' :
                        b.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400' :
                        'bg-amber-500/10 text-amber-400'}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3 text-right text-white font-medium">
                    {new Intl.NumberFormat('vi-VN').format(b.totalPrice || 0)}đ
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && !loading && (
                <tr><td colSpan={5} className="py-8 text-center text-slate-500">Chưa có booking nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
