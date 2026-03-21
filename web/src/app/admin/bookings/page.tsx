'use client';

import { useEffect, useState } from 'react';
import { bookingsApi } from '@/lib/api';
import { Search, Filter, XCircle } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  PENDING: { label: 'Chờ xử lý', class: 'bg-amber-500/10 text-amber-400' },
  CONFIRMED: { label: 'Đã xác nhận', class: 'bg-emerald-500/10 text-emerald-400' },
  COMPLETED: { label: 'Hoàn thành', class: 'bg-blue-500/10 text-blue-400' },
  CANCELLED: { label: 'Đã hủy', class: 'bg-red-500/10 text-red-400' },
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await bookingsApi.list();
        setBookings(Array.isArray(data) ? data : []);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const filtered = statusFilter === 'ALL' ? bookings : bookings.filter((b) => b.status === statusFilter);
  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

  const handleCancel = async (id: number) => {
    if (!confirm('Bạn có chắc muốn hủy booking này?')) return;
    try {
      await bookingsApi.cancel(id);
      setBookings(bookings.map((b) => b.id === id ? { ...b, status: 'CANCELLED' } : b));
    } catch { alert('Không thể hủy booking'); }
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <Filter size={16} className="text-slate-500" />
          {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition
                ${statusFilter === s ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
              {s === 'ALL' ? 'Tất cả' : STATUS_MAP[s]?.label || s}
            </button>
          ))}
        </div>
        <span className="ml-auto text-sm text-slate-500">{filtered.length} kết quả</span>
      </div>

      <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 bg-slate-900/50">
              <th className="px-5 py-3.5 font-medium">#ID</th>
              <th className="px-5 py-3.5 font-medium">Khách Hàng</th>
              <th className="px-5 py-3.5 font-medium">Tour</th>
              <th className="px-5 py-3.5 font-medium">Ngày</th>
              <th className="px-5 py-3.5 font-medium">Slg</th>
              <th className="px-5 py-3.5 font-medium">Trạng Thái</th>
              <th className="px-5 py-3.5 font-medium">Thanh Toán</th>
              <th className="px-5 py-3.5 font-medium text-right">Tổng</th>
              <th className="px-5 py-3.5 font-medium text-center">Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="py-12 text-center text-slate-500">Đang tải...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} className="py-12 text-center text-slate-500">Không có booking nào</td></tr>
            ) : filtered.map((b) => (
              <tr key={b.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                <td className="px-5 py-3.5 text-slate-300 font-mono">#{b.id}</td>
                <td className="px-5 py-3.5 text-white">{b.contactName || `User #${b.userId}`}</td>
                <td className="px-5 py-3.5 text-slate-400">{b.tourTitle || `Tour #${b.tourId}`}</td>
                <td className="px-5 py-3.5 text-slate-400">{b.bookingDate?.split('T')[0]}</td>
                <td className="px-5 py-3.5 text-slate-400">{b.travelers}</td>
                <td className="px-5 py-3.5">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${STATUS_MAP[b.status]?.class || 'bg-slate-700 text-slate-300'}`}>
                    {STATUS_MAP[b.status]?.label || b.status}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs ${b.paymentStatus === 'PAID' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {b.paymentStatus || 'UNPAID'}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right text-white font-medium">{fmt(b.totalPrice || 0)}</td>
                <td className="px-5 py-3.5 text-center">
                  {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && (
                    <button onClick={() => handleCancel(b.id)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-400 transition">
                      <XCircle size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
