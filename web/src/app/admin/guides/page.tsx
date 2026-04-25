'use client';

import { useEffect, useState } from 'react';
import { guidesApi, toursApi, bookingsApi } from '@/lib/api';
import { Plus, Search, Trash2, X, UserCheck, CalendarCheck, CheckCircle, Shield, Info, Map } from 'lucide-react';
import { Pagination } from '@/components/Pagination';

const inputCls = 'w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:outline-none text-sm transition-all';
const labelCls = 'block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5';

const STATUS_STYLES: Record<string, string> = {
  ASSIGNED: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20',
  COMPLETED: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20',
  CANCELLED: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20',
};

const SkeletonRow = () => (
  <tr className="animate-pulse border-b border-slate-100 dark:border-white/5">
    <td className="py-4 px-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-16" />
        </div>
      </div>
    </td>
    <td className="py-4 px-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-48" /></td>
    <td className="py-4 px-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" /></td>
    <td className="py-4 px-5"><div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-20" /></td>
  </tr>
);

export default function GuidesPage() {
  const [guides, setGuides] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [tours, setTours] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Pagination
  const [guidesPage, setGuidesPage] = useState(1);
  const [schedulesPage, setSchedulesPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [createGuideOpen, setCreateGuideOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create Guide Form
  const [guideForm, setGuideForm] = useState({
    username: '', email: '', password: '', fullName: '', phone: ''
  });

  // Assign Form
  const [assignForm, setAssignForm] = useState({
    guideUserId: 0, bookingId: 0, tourId: 0, startDate: '', endDate: '', notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [gRes, sRes, tRes, bRes] = await Promise.allSettled([
        guidesApi.listByRole('GUIDE'),
        guidesApi.listSchedules(),
        toursApi.list(),
        bookingsApi.list(),
      ]);
      setGuides(gRes.status === 'fulfilled' && Array.isArray(gRes.value.data) ? gRes.value.data : []);
      setSchedules(sRes.status === 'fulfilled' && Array.isArray(sRes.value.data) ? sRes.value.data : []);
      setTours(tRes.status === 'fulfilled' && Array.isArray(tRes.value.data) ? tRes.value.data : []);
      setBookings(bRes.status === 'fulfilled' && Array.isArray(bRes.value.data) ? bRes.value.data : []);

      const failures = [gRes, sRes, tRes, bRes].filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        if (gRes.status === 'rejected') setError('Không thể tải danh sách guide. Kiểm tra identity-service.');
      }
    } catch (err) {
      setError('Lỗi kết nối server. Kiểm tra lại backend.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredGuides = guides.filter((g) =>
    !search || g.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    g.username?.toLowerCase().includes(search.toLowerCase()) ||
    g.email?.toLowerCase().includes(search.toLowerCase())
  );
  
  const totalGuidesPages = Math.ceil(filteredGuides.length / pageSize);
  const currentGuides = filteredGuides.slice((guidesPage - 1) * pageSize, guidesPage * pageSize);
  useEffect(() => { setGuidesPage(1); }, [search]);
  
  const totalSchedulesPages = Math.ceil(schedules.length / pageSize);
  const currentSchedules = schedules.slice((schedulesPage - 1) * pageSize, schedulesPage * pageSize);

  const getGuideName = (id: number) => {
    const g = guides.find((x) => x.id === id);
    return g?.fullName || g?.username || `Guide #${id}`;
  };

  const getTourTitle = (id: number) => {
    const t = tours.find((x) => x.id === id);
    return t?.title || `Tour #${id}`;
  };

  const assignableBookings = bookings.filter((b) => {
    const isConfirmed = b.status === 'CONFIRMED';
    const alreadyAssigned = schedules.some(
      (s) => String(s.bookingId) === String(b.id) && s.status !== 'CANCELLED'
    );
    return isConfirmed && !alreadyAssigned;
  });

  const handleCreateGuide = async () => {
    if (!guideForm.username.trim() || !guideForm.email.trim() || !guideForm.password.trim()) {
      alert('Vui lòng nhập Username, Email, Password');
      return;
    }
    setSaving(true);
    try {
      await guidesApi.createGuide(guideForm);
      setCreateGuideOpen(false);
      setGuideForm({ username: '', email: '', password: '', fullName: '', phone: '' });
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Lỗi tạo guide');
    } finally { setSaving(false); }
  };

  const handleBookingSelect = (bookingId: number) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) {
      setAssignForm({ ...assignForm, bookingId, tourId: 0, startDate: '', endDate: '' });
      return;
    }
    const tour = tours.find((t) => t.id === booking.tourId);
    const startDate = booking.bookingDate?.split('T')[0] || '';
    let endDate = startDate;
    if (tour && tour.duration && startDate) {
      const start = new Date(startDate);
      start.setDate(start.getDate() + tour.duration - 1);
      endDate = start.toISOString().split('T')[0];
    }
    setAssignForm({
      ...assignForm,
      bookingId,
      tourId: booking.tourId,
      startDate,
      endDate,
    });
  };

  const handleAssign = async () => {
    if (!assignForm.guideUserId || !assignForm.bookingId || !assignForm.startDate || !assignForm.endDate) {
      alert('Vui lòng chọn Guide, Booking, Ngày bắt đầu và Kết thúc');
      return;
    }
    setSaving(true);
    try {
      await guidesApi.assign(assignForm);
      setAssignOpen(false);
      setAssignForm({ guideUserId: 0, bookingId: 0, tourId: 0, startDate: '', endDate: '', notes: '' });
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Lỗi phân công');
    } finally { setSaving(false); }
  };

  const handleStatusChange = async (id: number, status: string, bookingId?: number) => {
    try {
      await guidesApi.updateStatus(id, status);
      
      if (status === 'COMPLETED' && bookingId) {
        if (confirm('Hướng dẫn viên đã hoàn thành lịch trình. Bạn có muốn đánh dấu Booking tương ứng là Hoàn thành luôn không?')) {
          try {
            await bookingsApi.complete(bookingId);
          } catch (err: any) {
            console.error('Lỗi khi đánh dấu hoàn thành booking', err);
          }
        }
      }
      
      fetchData();
    } catch { alert('Lỗi cập nhật trạng thái'); }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!confirm('Xoá phân công này?')) return;
    try {
      await guidesApi.delete(id);
      fetchData();
    } catch { alert('Lỗi xoá phân công'); }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Hướng Dẫn Viên</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Quản lý tài khoản và lịch trình hướng dẫn</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-6 py-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl shadow-sm">
          <Info className="text-red-500 shrink-0" size={20} />
          <p className="text-sm text-red-700 dark:text-red-400 font-medium flex-1">{error}</p>
          <button onClick={fetchData} className="px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-500/20 dark:hover:bg-red-500/30 text-red-700 dark:text-red-300 rounded-lg text-xs font-bold transition-colors">
            Thử lại
          </button>
        </div>
      )}

      {/* ── Section 1: Danh sách Hướng dẫn viên ── */}
      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <UserCheck size={20} />
            </div>
            Nhân Sự ({guides.length})
          </h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm guide..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500/50 focus:outline-none text-sm transition-all" />
            </div>
            <button onClick={() => setCreateGuideOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-sm transition-colors shrink-0">
              <Plus size={16} /> Thêm Mới
            </button>
          </div>
        </div>

        <div className="border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-white/5">
                <th className="px-5 py-3.5 font-semibold uppercase text-xs tracking-wider">Hướng Dẫn Viên</th>
                <th className="px-5 py-3.5 font-semibold uppercase text-xs tracking-wider">Email</th>
                <th className="px-5 py-3.5 font-semibold uppercase text-xs tracking-wider">SĐT</th>
                <th className="px-5 py-3.5 font-semibold uppercase text-xs tracking-wider">Hoạt Động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
              ) : filteredGuides.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="py-12 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                      <Shield size={32} className="mb-3 opacity-50" />
                      <p>Không có hướng dẫn viên nào</p>
                    </div>
                  </td>
                </tr>
              ) : currentGuides.map((g) => {
                const tourCount = schedules.filter((s) => s.guideUserId === g.id).length;
                return (
                  <tr key={g.id} className="group border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-500/20 dark:to-indigo-500/20 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-sm border border-white/50 dark:border-white/5 shadow-sm group-hover:scale-105 transition-transform">
                          {(g.fullName || g.username || '?')[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-slate-900 dark:text-white font-semibold">{g.fullName || g.username}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">ID: {g.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400 font-medium">{g.email || '—'}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{g.phone || '—'}</td>
                    <td className="px-5 py-4">
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
                        {tourCount} chuyến đi
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={guidesPage}
          totalPages={totalGuidesPages}
          onPageChange={setGuidesPage}
          pageSize={pageSize}
          totalItems={filteredGuides.length}
        />
      </div>

      {/* ── Section 2: Bảng phân công ── */}
      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <div className="p-2 bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl">
              <CalendarCheck size={20} />
            </div>
            Lịch Trình Đã Phân Công ({schedules.length})
          </h2>
          <button onClick={() => setAssignOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-bold rounded-xl shadow-sm shadow-blue-500/20 hover:shadow-md hover:shadow-blue-500/30 transition-all">
            <Plus size={16} /> Phân công Tour mới
          </button>
        </div>

        <div className="border border-slate-100 dark:border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-white/5">
                <th className="px-5 py-3.5 font-semibold uppercase text-xs tracking-wider">Hướng Dẫn Viên</th>
                <th className="px-5 py-3.5 font-semibold uppercase text-xs tracking-wider">Tour / Booking</th>
                <th className="px-5 py-3.5 font-semibold uppercase text-xs tracking-wider">Lịch Trình</th>
                <th className="px-5 py-3.5 font-semibold uppercase text-xs tracking-wider">Trạng Thái</th>
                <th className="px-5 py-3.5 font-semibold uppercase text-xs tracking-wider text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <><SkeletonRow /><SkeletonRow /></>
              ) : schedules.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="py-12 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                      <Map size={32} className="mb-3 opacity-50" />
                      <p>Chưa có tour nào được phân công</p>
                    </div>
                  </td>
                </tr>
              ) : currentSchedules.map((s) => {
                const booking = bookings.find((b) => b.id === s.bookingId);
                return (
                  <tr key={s.id} className="group border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 text-slate-900 dark:text-white font-bold">{getGuideName(s.guideUserId)}</td>
                    <td className="px-5 py-4">
                      <p className="text-slate-900 dark:text-white font-medium max-w-[200px] truncate" title={getTourTitle(s.tourId)}>
                        {getTourTitle(s.tourId)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">#{s.bookingId || '—'}</span>
                        {booking && (
                          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            · {booking.contactName || 'Khách'} ({booking.travelers || 1} khách)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-0.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> {s.startDate}</span>
                        <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> {s.endDate}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[s.status] || STATUS_STYLES.ASSIGNED}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        {s.status === 'ASSIGNED' && (
                          <button onClick={() => handleStatusChange(s.id, 'COMPLETED', s.bookingId)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 rounded-lg transition-colors" title="Đánh dấu hoàn thành">
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button onClick={() => handleDeleteSchedule(s.id)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 rounded-lg transition-colors" title="Xoá phân công">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={schedulesPage}
          totalPages={totalSchedulesPages}
          onPageChange={setSchedulesPage}
          pageSize={pageSize}
          totalItems={schedules.length}
        />
      </div>

      {/* ── Modal: Tạo Guide mới ── */}
      {createGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck size={20} className="text-blue-500" /> Thêm HDV Mới
              </h3>
              <button onClick={() => setCreateGuideOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Tài khoản <span className="text-red-500">*</span></label>
                  <input value={guideForm.username} onChange={(e) => setGuideForm({ ...guideForm, username: e.target.value })}
                    placeholder="guide_ha_noi" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Họ tên</label>
                  <input value={guideForm.fullName} onChange={(e) => setGuideForm({ ...guideForm, fullName: e.target.value })}
                    placeholder="Nguyễn Văn A" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Email <span className="text-red-500">*</span></label>
                <input type="email" value={guideForm.email} onChange={(e) => setGuideForm({ ...guideForm, email: e.target.value })}
                  placeholder="guide@dulich.vn" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Mật khẩu <span className="text-red-500">*</span></label>
                  <input type="password" value={guideForm.password} onChange={(e) => setGuideForm({ ...guideForm, password: e.target.value })}
                    placeholder="••••••" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Số điện thoại</label>
                  <input value={guideForm.phone} onChange={(e) => setGuideForm({ ...guideForm, phone: e.target.value })}
                    placeholder="0901234567" className={inputCls} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/30 rounded-b-3xl">
              <button onClick={() => setCreateGuideOpen(false)}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">Hủy</button>
              <button onClick={handleCreateGuide} disabled={saving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow-md transition-all">
                {saving ? 'Đang tạo...' : 'Tạo HDV'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Phân công Guide theo Booking ── */}
      {assignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarCheck size={20} className="text-violet-500" /> Phân Công Lịch Trình
              </h3>
              <button onClick={() => setAssignOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl flex gap-3">
                <Info className="text-blue-500 shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Phân công HDV cho các booking <strong>Đã xác nhận</strong>. Lịch trình sẽ được tự động đồng bộ theo độ dài của tour.
                </p>
              </div>

              <div>
                <label className={labelCls}>Chọn Booking <span className="text-red-500">*</span></label>
                <select
                  value={assignForm.bookingId}
                  onChange={(e) => handleBookingSelect(+e.target.value)}
                  className={inputCls + ' appearance-none cursor-pointer'}
                >
                  <option value={0} disabled>— Chọn booking cần phân công —</option>
                  {assignableBookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      #{b.id} — {b.tourTitle || getTourTitle(b.tourId)} | {b.contactName || 'Khách'}
                    </option>
                  ))}
                </select>
                {assignableBookings.length === 0 && !loading && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
                    Không có booking nào đủ điều kiện phân công
                  </p>
                )}
              </div>

              {assignForm.bookingId > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-white/5 flex items-start gap-3">
                  <Map className="text-slate-400 mt-0.5" size={18} />
                  <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Tour tương ứng</p>
                    <p className="text-sm text-slate-900 dark:text-white font-medium">{getTourTitle(assignForm.tourId)}</p>
                  </div>
                </div>
              )}

              <div>
                <label className={labelCls}>Chọn HDV <span className="text-red-500">*</span></label>
                <select value={assignForm.guideUserId} onChange={(e) => setAssignForm({ ...assignForm, guideUserId: +e.target.value })}
                  className={inputCls + ' appearance-none cursor-pointer'}>
                  <option value={0} disabled>— Chọn hướng dẫn viên —</option>
                  {guides.map((g) => (
                    <option key={g.id} value={g.id}>{g.fullName || g.username} (ID: {g.id})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}>Ngày khởi hành <span className="text-red-500">*</span></label>
                  <input type="date" value={assignForm.startDate} onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Ngày kết thúc <span className="text-red-500">*</span></label>
                  <input type="date" value={assignForm.endDate} onChange={(e) => setAssignForm({ ...assignForm, endDate: e.target.value })}
                    className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Ghi chú thêm</label>
                <textarea value={assignForm.notes} onChange={(e) => setAssignForm({ ...assignForm, notes: e.target.value })}
                  placeholder="Lưu ý đặc biệt cho HDV về đoàn khách này..." rows={3}
                  className={inputCls + ' resize-none'} />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/30 rounded-b-3xl">
              <button onClick={() => setAssignOpen(false)}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">Hủy</button>
              <button onClick={handleAssign} disabled={saving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow-md transition-all">
                {saving ? 'Đang phân công...' : 'Chốt Phân Công'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
