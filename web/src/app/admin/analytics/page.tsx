'use client';

import { useEffect, useState } from 'react';
import { analyticsApi, bookingsApi } from '@/lib/api';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, DollarSign, Wallet, PieChart as PieIcon, Activity, CreditCard, LayoutDashboard } from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Đã xác nhận', PENDING: 'Chờ xử lý', CANCELLED: 'Đã hủy', COMPLETED: 'Hoàn thành',
};

const SkeletonCard = () => (
  <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-6 animate-pulse">
    <div className="flex items-center gap-4 mb-4">
      <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" />
    </div>
    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-32" />
  </div>
);

const SkeletonChart = ({ height = 300 }) => (
  <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-6 animate-pulse" style={{ height }}>
    <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-48 mb-6" />
    <div className="w-full h-[calc(100%-2rem)] bg-slate-100 dark:bg-slate-800/50 rounded-2xl" />
  </div>
);

export default function AnalyticsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [profits, setProfits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [b, p] = await Promise.allSettled([
          bookingsApi.list(),
          analyticsApi.getAllProfits(),
        ]);
        if (b.status === 'fulfilled') {
          setBookings(Array.isArray(b.value.data) ? b.value.data : []);
        } else {
          console.warn('Bookings API failed:', b.reason);
          setError('Không thể tải dữ liệu bookings.');
        }
        if (p.status === 'fulfilled') setProfits(Array.isArray(p.value.data) ? p.value.data : []);
      } catch (err) {
        console.error('Analytics fetch error:', err);
        setError('Lỗi kết nối server.');
      } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // Revenue by month
  const revenueByMonth = bookings.reduce((acc: Record<string, number>, b: any) => {
    const date = b.bookingDate || b.createdAt || '';
    const month = date.substring(0, 7) || 'N/A';
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
  const statusChart = Object.entries(statusDist).map(([name, value]) => ({
    name: STATUS_LABELS[name] || name, value,
  }));

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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 p-3 rounded-xl shadow-xl">
          <p className="text-slate-300 text-xs mb-1 font-medium">{label}</p>
          <p className="text-white font-bold text-sm">
            {payload[0].value} {payload[0].name === 'revenue' ? 'Triệu VNĐ' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Thống Kê Kinh Doanh</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Tổng quan về hoạt động và doanh thu</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-6 py-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl shadow-sm">
          <Activity className="text-amber-500 shrink-0" size={20} />
          <p className="text-sm text-amber-700 dark:text-amber-400 font-medium flex-1">{error}</p>
          <button onClick={() => window.location.reload()} className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-bold transition-colors">
            Thử lại
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {loading ? (
          <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
        ) : (
          <>
            <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm group hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                <DollarSign size={100} />
              </div>
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <DollarSign className="text-white" size={24} />
                </div>
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Tổng Doanh Thu</span>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white relative z-10 tracking-tight">
                {fmt(totalRevenue)}<span className="text-lg text-slate-500 ml-1">đ</span>
              </p>
            </div>
            
            <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm group hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                <TrendingUp size={100} />
              </div>
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <TrendingUp className="text-white" size={24} />
                </div>
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Trung Bình Đơn</span>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white relative z-10 tracking-tight">
                {fmt(avgBookingValue)}<span className="text-lg text-slate-500 ml-1">đ</span>
              </p>
            </div>
            
            <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm group hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                <Wallet size={100} />
              </div>
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <Wallet className="text-white" size={24} />
                </div>
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Tổng Bookings</span>
              </div>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-white relative z-10 tracking-tight">
                {bookings.length}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <SkeletonChart height={380} />
        ) : (
          <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
                <TrendingUp size={18} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Doanh Thu Theo Tháng (Triệu VNĐ)</h3>
            </div>
            {revenueChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenueChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#revGrad)" strokeWidth={3} activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <TrendingUp size={32} className="mb-3 opacity-20" />
                <p>Chưa có dữ liệu doanh thu</p>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <SkeletonChart height={380} />
        ) : (
          <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
                <PieIcon size={18} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Phân Bố Trạng Thái Booking</h3>
            </div>
            {statusChart.length > 0 ? (
              <div className="flex-1 min-h-[280px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusChart} cx="50%" cy="50%" innerRadius={70} outerRadius={110}
                      paddingAngle={5} dataKey="value" stroke="none">
                      {statusChart.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Custom Legend */}
                <div className="absolute top-1/2 -translate-y-1/2 right-4 flex flex-col gap-3 pointer-events-none">
                  {statusChart.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-100 dark:border-white/5 shadow-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.name}</span>
                      <span className="text-xs text-slate-500 font-medium ml-2">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[280px] flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <PieIcon size={32} className="mb-3 opacity-20" />
                <p>Chưa có dữ liệu trạng thái</p>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <SkeletonChart height={380} />
        ) : (
          <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-violet-50 dark:bg-violet-500/10 rounded-xl text-violet-600 dark:text-violet-400">
                <CreditCard size={18} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Phương Thức Thanh Toán</h3>
            </div>
            {paymentChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={paymentChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <CreditCard size={32} className="mb-3 opacity-20" />
                <p>Chưa có dữ liệu thanh toán</p>
              </div>
            )}
          </div>
        )}

        {/* Profit By Tour Table */}
        {loading ? (
          <SkeletonChart height={380} />
        ) : (
          <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-fuchsia-50 dark:bg-fuchsia-500/10 rounded-xl text-fuchsia-600 dark:text-fuchsia-400">
                <LayoutDashboard size={18} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Lợi Nhuận Theo Tour</h3>
            </div>
            {profits.length > 0 ? (
              <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-100 dark:border-slate-800 rounded-2xl max-h-[280px]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 sticky top-0 backdrop-blur-md z-10 border-b border-slate-100 dark:border-slate-700">
                      <th className="px-4 py-3 font-semibold uppercase text-[10px] tracking-wider">Tour</th>
                      <th className="px-4 py-3 font-semibold uppercase text-[10px] tracking-wider text-right">Doanh thu</th>
                      <th className="px-4 py-3 font-semibold uppercase text-[10px] tracking-wider text-right">Chi phí</th>
                      <th className="px-4 py-3 font-semibold uppercase text-[10px] tracking-wider text-right">Lợi nhuận</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profits.map((p: any, i: number) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                        <td className="px-4 py-3 text-slate-900 dark:text-white font-medium max-w-[150px] truncate" title={p.tourTitle || `Tour #${p.tourId}`}>
                          {p.tourTitle || `Tour #${p.tourId}`}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">{fmt(p.totalRevenue || 0)}đ</td>
                        <td className="px-4 py-3 text-right text-red-600 dark:text-red-400 opacity-80">{fmt(p.totalCost || 0)}đ</td>
                        <td className="px-4 py-3 text-right font-bold">
                          <span className={(p.profit || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                            {fmt(p.profit || 0)}đ
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-[280px] flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <LayoutDashboard size={32} className="mb-3 opacity-20" />
                <p>Chưa có dữ liệu lợi nhuận</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
