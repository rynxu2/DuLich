'use client';

import { useEffect, useState } from 'react';
import { bookingsApi } from '@/lib/api';
import { Filter, XCircle, CheckCircle, Ban, Search, CalendarDays } from 'lucide-react';
import { Pagination } from '@/components/Pagination';

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  PENDING: { label: 'Chờ xử lý', class: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  CONFIRMED: { label: 'Đã xác nhận', class: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  COMPLETED: { label: 'Hoàn thành', class: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  CANCELLED: { label: 'Đã hủy', class: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' },
};

const SkeletonRow = () => (
  <tr className="animate-pulse border-b border-slate-100 dark:border-white/5">
    <td className="py-4 px-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16" /></td>
    <td className="py-4 px-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32" /></td>
    <td className="py-4 px-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-48" /></td>
    <td className="py-4 px-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" /></td>
    <td className="py-4 px-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-8" /></td>
    <td className="py-4 px-5"><div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-20" /></td>
    <td className="py-4 px-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16" /></td>
    <td className="py-4 px-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24 ml-auto" /></td>
    <td className="py-4 px-5"><div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-16 mx-auto" /></td>
  </tr>
);

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data } = await bookingsApi.list();
      setBookings(Array.isArray(data) ? data : []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchBookings(); }, []);

  const filtered = bookings.filter((b) => {
    const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      String(b.id).includes(q) ||
      (b.contactName || '').toLowerCase().includes(q) ||
      (b.tourTitle || '').toLowerCase().includes(q) ||
      (b.contactPhone || '').includes(q);
    return matchStatus && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const currentBookings = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

  const pendingCount = bookings.filter((b) => b.status === 'PENDING').length;

  const handleConfirm = async (id: number) => {
    if (!confirm('Xác nhận booking này?')) return;
    try {
      await bookingsApi.confirm(id);
      setBookings(bookings.map((b) => b.id === id ? { ...b, status: 'CONFIRMED' } : b));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể xác nhận booking');
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('Từ chối booking này? Booking sẽ bị hủy.')) return;
    try {
      await bookingsApi.reject(id);
      setBookings(bookings.map((b) => b.id === id ? { ...b, status: 'CANCELLED' } : b));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể từ chối booking');
    }
  };

  const handleComplete = async (id: number) => {
    if (!confirm('Đánh dấu booking này là Đã hoàn thành?')) return;
    try {
      await bookingsApi.complete(id);
      setBookings(bookings.map((b) => b.id === id ? { ...b, status: 'COMPLETED' } : b));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể đánh dấu hoàn thành booking');
    }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Bạn có chắc muốn hủy booking này?')) return;
    try {
      await bookingsApi.cancel(id);
      setBookings(bookings.map((b) => b.id === id ? { ...b, status: 'CANCELLED' } : b));
    } catch { alert('Không thể hủy booking'); }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quản lý Bookings</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Duyệt và quản lý các lượt đặt tour từ khách hàng</p>
        </div>
      </div>

      {/* Pending Alert */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-500/10 dark:to-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-2xl shadow-sm">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-20" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 relative z-10" />
          </div>
          <p className="text-sm text-amber-800 dark:text-amber-300 font-medium flex-1">
            Có <span className="font-bold text-amber-600 dark:text-amber-400 text-base">{pendingCount}</span> booking đang chờ được xử lý
          </p>
          <button onClick={() => setStatusFilter('PENDING')}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm">
            Xử lý ngay
          </button>
        </div>
      )}

      {/* Search + Filters Container */}
      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-5 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Tìm theo ID, Tên khách, SĐT, hoặc Tên Tour..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:outline-none transition-all" 
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 xl:pb-0 hide-scrollbar">
            {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((s) => {
              const count = s === 'ALL' ? bookings.length : bookings.filter((b) => b.status === s).length;
              const isActive = statusFilter === s;
              return (
                <button 
                  key={s} 
                  onClick={() => setStatusFilter(s)}
                  className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2
                    ${isActive 
                      ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-500/20' 
                      : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  {s === 'ALL' ? 'Tất cả' : STATUS_MAP[s]?.label || s}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-blue-100 dark:bg-blue-500/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-white/5">
                <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider">#ID</th>
                <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider">Khách Hàng</th>
                <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider">Tour</th>
                <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider">Ngày</th>
                <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider">SL</th>
                <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider">Trạng Thái</th>
                <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider">Thanh Toán</th>
                <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider text-right">Tổng Tiền</th>
                <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow />
                </>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="py-20 flex flex-col items-center justify-center">
                      <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                        <CalendarDays size={32} className="text-slate-400 dark:text-slate-500" />
                      </div>
                      <p className="text-slate-900 dark:text-white font-medium text-lg">Không tìm thấy booking nào</p>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                  </td>
                </tr>
              ) : currentBookings.map((b) => (
                <tr key={b.id} className={`group border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors
                  ${b.status === 'PENDING' ? 'bg-amber-50/20 dark:bg-amber-500/[0.02]' : ''}`}>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs">#{b.id}</td>
                  <td className="px-5 py-4">
                    <p className="text-slate-900 dark:text-white font-medium">{b.contactName || `User #${b.userId}`}</p>
                    {b.contactPhone && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{b.contactPhone}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-slate-700 dark:text-slate-300 font-medium max-w-[200px] truncate" title={b.tourTitle}>{b.tourTitle || `Tour #${b.tourId}`}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{b.bookingDate?.split('T')[0]}</td>
                  <td className="px-5 py-4 font-medium text-slate-700 dark:text-slate-300">{b.travelers} <span className="text-xs font-normal text-slate-400">người</span></td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${STATUS_MAP[b.status]?.class || 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {STATUS_MAP[b.status]?.label || b.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${b.paymentStatus === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className={`text-xs font-medium ${b.paymentStatus === 'PAID' ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                        {b.paymentStatus || 'UNPAID'}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="font-bold text-slate-900 dark:text-white">{fmt(b.totalPrice || 0)}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2 transition-opacity">
                      {/* PENDING: Show Confirm + Reject */}
                      {b.status === 'PENDING' && (
                        <>
                          <button onClick={() => handleConfirm(b.id)}
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20 rounded-lg transition-colors"
                            title="Xác nhận">
                            <CheckCircle size={16} />
                          </button>
                          <button onClick={() => handleReject(b.id)}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Từ chối">
                            <Ban size={16} />
                          </button>
                        </>
                      )}
                      {/* CONFIRMED: Show Complete + Cancel */}
                      {b.status === 'CONFIRMED' && (
                        <>
                          <button onClick={() => handleComplete(b.id)}
                            className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 rounded-lg transition-colors"
                            title="Đánh dấu hoàn thành">
                            <CheckCircle size={16} />
                          </button>
                          <button onClick={() => handleCancel(b.id)}
                            className="p-1.5 bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 rounded-lg transition-colors"
                            title="Hủy booking">
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                      {b.status !== 'PENDING' && b.status !== 'CONFIRMED' && (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          totalItems={filtered.length}
        />
      </div>
    </div>
  );
}
