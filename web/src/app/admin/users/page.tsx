'use client';

import { useEffect, useState } from 'react';
import { usersApi, bookingsApi } from '@/lib/api';
import { Search, X, CalendarCheck, Star, Mail, Phone, Shield, UserCheck, Ban, Users } from 'lucide-react';
import { Pagination } from '@/components/Pagination';

const ROLES = ['USER', 'GUIDE', 'ADMIN'] as const;

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
    <td className="py-4 px-5"><div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-20" /></td>
    <td className="py-4 px-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" /></td>
    <td className="py-4 px-5"><div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-24 mx-auto" /></td>
  </tr>
);

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await usersApi.list();
      setUsers(Array.isArray(data) ? data : []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter((u) => {
    const matchSearch = !search ||
      u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || (u.role || 'USER').toUpperCase() === roleFilter;
    return matchSearch && matchRole;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const currentUsers = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => { setCurrentPage(1); }, [search, roleFilter]);

  const openDetail = async (user: any) => {
    setSelectedUser(user);
    setDetailLoading(true);
    try {
      const { data } = await bookingsApi.getByUser(user.id || user.userId);
      setUserBookings(Array.isArray(data) ? data : []);
    } catch { setUserBookings([]); }
    finally { setDetailLoading(false); }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    if (!confirm(`Đổi role thành ${newRole}?`)) return;
    try {
      await usersApi.updateRole(userId, newRole);
      setUsers(users.map((u) =>
        (u.id || u.userId) === userId ? { ...u, role: newRole } : u
      ));
      if (selectedUser && (selectedUser.id || selectedUser.userId) === userId) {
        setSelectedUser({ ...selectedUser, role: newRole });
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Không thể đổi role');
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

  const getRoleBadge = (role: string) => {
    const r = (role || 'USER').toUpperCase();
    const styles: Record<string, string> = {
      ADMIN: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20',
      GUIDE: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20',
      USER: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
    };
    return <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${styles[r] || styles.USER}`}>{r}</span>;
  };

  const roleCounts = {
    ALL: users.length,
    USER: users.filter(u => (u.role || 'USER').toUpperCase() === 'USER').length,
    GUIDE: users.filter(u => (u.role || '').toUpperCase() === 'GUIDE').length,
    ADMIN: users.filter(u => (u.role || '').toUpperCase() === 'ADMIN').length,
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Người Dùng</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Quản lý tài khoản và phân quyền hệ thống</p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-5 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Tìm theo tên, email, username..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:outline-none transition-all" 
            />
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 xl:pb-0 hide-scrollbar">
            {(['ALL', 'USER', 'GUIDE', 'ADMIN'] as const).map((r) => {
              const isActive = roleFilter === r;
              return (
                <button 
                  key={r} 
                  onClick={() => setRoleFilter(r)}
                  className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2
                    ${isActive 
                      ? 'bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-500/20' 
                      : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  {r === 'ALL' ? 'Tất cả' : r}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${isActive ? 'bg-blue-100 dark:bg-blue-500/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    {roleCounts[r]}
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
                <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider">User</th>
                <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider">Email</th>
                <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider">SĐT</th>
                <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider">Role</th>
                <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider">Ngày Tạo</th>
                <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider text-center">Phân Quyền</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow />
                </>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="py-20 flex flex-col items-center justify-center">
                      <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                        <Users size={32} className="text-slate-400 dark:text-slate-500" />
                      </div>
                      <p className="text-slate-900 dark:text-white font-medium text-lg">Không tìm thấy người dùng nào</p>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                  </td>
                </tr>
              ) : currentUsers.map((u) => (
                <tr key={u.id} className="group border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4 cursor-pointer" onClick={() => openDetail(u)}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-500/20 dark:to-indigo-500/20 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-sm border border-white/50 dark:border-white/5 shadow-sm group-hover:scale-105 transition-transform">
                          {(u.fullName || u.username || '?')[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-slate-900 dark:text-white font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {u.fullName || u.username || 'N/A'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">ID: {u.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{u.email || 'N/A'}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-400">{u.phone || '—'}</td>
                    <td className="px-5 py-4">{getRoleBadge(u.role)}</td>
                    <td className="px-5 py-4 text-slate-500 dark:text-slate-400 text-xs">{u.createdAt?.split('T')[0] || '—'}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1">
                        {(u.role || 'USER').toUpperCase() !== 'ADMIN' ? (
                          <div className="relative">
                            <select
                              value={(u.role || 'USER').toUpperCase()}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="appearance-none bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-transparent dark:border-white/5 rounded-xl px-4 py-2 pr-8 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all"
                            >
                              {ROLES.map((r) => (
                                <option key={r} value={r}>{r}</option>
                              ))}
                            </select>
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                              <Shield size={14} />
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Quản trị viên</span>
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

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Chi Tiết Người Dùng</h3>
              <button 
                onClick={() => setSelectedUser(null)} 
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {/* Profile Card */}
              <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-6 border border-slate-100 dark:border-white/5">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-500/20 dark:to-indigo-500/20 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-3xl border-4 border-white dark:border-slate-800 shadow-sm shrink-0">
                  {(selectedUser.fullName || selectedUser.username || '?')[0]?.toUpperCase()}
                </div>
                <div className="text-center sm:text-left flex-1 min-w-0">
                  <p className="text-xl font-bold text-slate-900 dark:text-white truncate">{selectedUser.fullName || selectedUser.username}</p>
                  
                  <div className="flex flex-col gap-2 mt-3">
                    {selectedUser.email && (
                      <span className="flex items-center justify-center sm:justify-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Mail size={14} className="text-slate-400" />
                        <span className="truncate">{selectedUser.email}</span>
                      </span>
                    )}
                    {selectedUser.phone && (
                      <span className="flex items-center justify-center sm:justify-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Phone size={14} className="text-slate-400" />
                        {selectedUser.phone}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                    {getRoleBadge(selectedUser.role)}
                    {(selectedUser.role || 'USER').toUpperCase() !== 'ADMIN' && (
                      <div className="relative">
                        <select
                          value={(selectedUser.role || 'USER').toUpperCase()}
                          onChange={(e) => handleRoleChange(selectedUser.id || selectedUser.userId, e.target.value)}
                          className="appearance-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1 pr-8 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer shadow-sm hover:border-blue-400 transition-colors"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>Đổi sang {r}</option>
                          ))}
                        </select>
                        <Shield size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-white/5 rounded-2xl p-5 text-center">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center mb-3">
                    <CalendarCheck size={20} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{detailLoading ? '...' : userBookings.length}</p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mt-1">Bookings</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-white/5 rounded-2xl p-5 text-center">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center mb-3">
                    <Star size={20} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-xl font-extrabold text-slate-900 dark:text-white truncate">
                    {detailLoading ? '...' : fmt(userBookings.reduce((s: number, b: any) => s + (b.totalPrice || 0), 0))}
                  </p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mt-1">Tổng chi tiêu</p>
                </div>
              </div>

              {/* Recent Bookings */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Lịch sử đặt tour</h4>
                  {!detailLoading && userBookings.length > 0 && (
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-md">
                      {userBookings.length}
                    </span>
                  )}
                </div>
                
                {detailLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse" />)}
                  </div>
                ) : userBookings.length === 0 ? (
                  <div className="bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl py-8 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có booking nào</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {userBookings.map((b: any) => (
                      <div key={b.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 rounded-xl p-4 transition-colors">
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="text-slate-900 dark:text-white font-medium text-sm truncate" title={b.tourTitle}>
                            {b.tourTitle || `Tour #${b.tourId}`}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{b.bookingDate?.split('T')[0]}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-slate-900 dark:text-white font-bold text-sm mb-1">{fmt(b.totalPrice || 0)}</p>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider
                            ${b.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 
                              b.status === 'CANCELLED' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' : 
                              'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'}`}>
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
        </div>
      )}
    </div>
  );
}
