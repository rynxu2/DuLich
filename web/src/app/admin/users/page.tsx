'use client';

import { useEffect, useState } from 'react';
import { usersApi, bookingsApi } from '@/lib/api';
import { Search, X, CalendarCheck, Star, Mail, Phone } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await usersApi.list();
        setUsers(Array.isArray(data) ? data : []);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const filtered = users.filter((u) =>
    !search || u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  const openDetail = async (user: any) => {
    setSelectedUser(user);
    setDetailLoading(true);
    try {
      const { data } = await bookingsApi.getByUser(user.id || user.userId);
      setUserBookings(Array.isArray(data) ? data : []);
    } catch { setUserBookings([]); }
    finally { setDetailLoading(false); }
  };

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

  const getRoleBadge = (role: string) => {
    const r = (role || 'USER').toUpperCase();
    const styles: Record<string, string> = {
      ADMIN: 'bg-red-500/10 text-red-400',
      GUIDE: 'bg-blue-500/10 text-blue-400',
      USER: 'bg-slate-700/50 text-slate-400',
    };
    return <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${styles[r] || styles.USER}`}>{r}</span>;
  };

  return (
    <div className="space-y-5">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm user..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none" />
      </div>

      <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 bg-slate-900/50">
              <th className="px-5 py-3.5 font-medium">User</th>
              <th className="px-5 py-3.5 font-medium">Email</th>
              <th className="px-5 py-3.5 font-medium">SĐT</th>
              <th className="px-5 py-3.5 font-medium">Role</th>
              <th className="px-5 py-3.5 font-medium">Ngày Tạo</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-12 text-center text-slate-500">Đang tải...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center text-slate-500">Không tìm thấy user</td></tr>
            ) : filtered.map((u) => (
              <tr key={u.id || u.userId} className="border-t border-white/5 hover:bg-white/[0.02] cursor-pointer"
                onClick={() => openDetail(u)}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-500/15 flex items-center justify-center text-blue-400 font-bold text-sm">
                      {(u.fullName || u.username || '?')[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">{u.fullName || u.username || 'N/A'}</p>
                      <p className="text-xs text-slate-500">ID: {u.id || u.userId}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-slate-400">{u.email || 'N/A'}</td>
                <td className="px-5 py-4 text-slate-400">{u.phone || '—'}</td>
                <td className="px-5 py-4">{getRoleBadge(u.role)}</td>
                <td className="px-5 py-4 text-slate-500">{u.createdAt?.split('T')[0] || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white">Chi Tiết User</h3>
              <button onClick={() => setSelectedUser(null)} className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400"><X size={20} /></button>
            </div>
            <div className="p-6">
              {/* Profile */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-blue-500/15 flex items-center justify-center text-blue-400 font-bold text-xl">
                  {(selectedUser.fullName || selectedUser.username || '?')[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-white text-lg font-semibold">{selectedUser.fullName || selectedUser.username}</p>
                  <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                    {selectedUser.email && <span className="flex items-center gap-1"><Mail size={12} />{selectedUser.email}</span>}
                    {selectedUser.phone && <span className="flex items-center gap-1"><Phone size={12} />{selectedUser.phone}</span>}
                  </div>
                  <div className="mt-2">{getRoleBadge(selectedUser.role)}</div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <CalendarCheck size={20} className="mx-auto mb-2 text-violet-400" />
                  <p className="text-2xl font-bold text-white">{detailLoading ? '...' : userBookings.length}</p>
                  <p className="text-xs text-slate-500">Bookings</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                  <Star size={20} className="mx-auto mb-2 text-amber-400" />
                  <p className="text-2xl font-bold text-white">
                    {detailLoading ? '...' : fmt(userBookings.reduce((s: number, b: any) => s + (b.totalPrice || 0), 0))}
                  </p>
                  <p className="text-xs text-slate-500">Tổng chi tiêu</p>
                </div>
              </div>

              {/* Recent Bookings */}
              <h4 className="text-sm font-medium text-slate-300 mb-3">Lịch sử đặt tour</h4>
              {detailLoading ? (
                <p className="text-center text-slate-500 py-4">Đang tải...</p>
              ) : userBookings.length === 0 ? (
                <p className="text-center text-slate-500 py-4">Chưa có booking nào</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {userBookings.map((b: any) => (
                    <div key={b.id} className="flex items-center justify-between bg-slate-800/30 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-white text-sm">{b.tourTitle || `Tour #${b.tourId}`}</p>
                        <p className="text-xs text-slate-500">{b.bookingDate?.split('T')[0]}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-sm font-medium">{fmt(b.totalPrice || 0)}</p>
                        <span className={`text-xs ${b.status === 'CONFIRMED' ? 'text-emerald-400' : b.status === 'CANCELLED' ? 'text-red-400' : 'text-amber-400'}`}>
                          {b.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
