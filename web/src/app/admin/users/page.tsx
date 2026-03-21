'use client';

import { useEffect, useState } from 'react';
import { usersApi } from '@/lib/api';
import { Search, Shield, User as UserIcon } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

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
              <th className="px-5 py-3.5 font-medium">Ngày Tạo</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="py-12 text-center text-slate-500">Đang tải...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="py-12 text-center text-slate-500">Không tìm thấy user</td></tr>
            ) : filtered.map((u) => (
              <tr key={u.id || u.userId} className="border-t border-white/5 hover:bg-white/[0.02]">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-500/15 flex items-center justify-center text-blue-400 font-bold text-sm">
                      {(u.fullName || u.username || '?')[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">{u.fullName || u.username || 'N/A'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-slate-400">{u.email || 'N/A'}</td>
                <td className="px-5 py-4 text-slate-400">{u.phone || '—'}</td>
                <td className="px-5 py-4 text-slate-500">{u.createdAt?.split('T')[0] || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
