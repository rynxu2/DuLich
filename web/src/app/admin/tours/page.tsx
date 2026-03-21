'use client';

import { useEffect, useState } from 'react';
import { toursApi } from '@/lib/api';
import { Plus, Pencil, Trash2, Search, MapPin } from 'lucide-react';

export default function ToursPage() {
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await toursApi.list(search ? { keyword: search } : undefined);
      setTours(data || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const filtered = tours.filter((t) =>
    !search || t.title?.toLowerCase().includes(search.toLowerCase()) ||
    t.location?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa tour này?')) return;
    try { await toursApi.delete(id); fetch(); } catch { alert('Không thể xóa tour'); }
  };

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tour..." onKeyDown={(e) => e.key === 'Enter' && fetch()}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white text-sm font-medium transition">
          <Plus size={18} /> Thêm Tour
        </button>
      </div>

      <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 bg-slate-900/50">
              <th className="px-5 py-3.5 font-medium">Tour</th>
              <th className="px-5 py-3.5 font-medium">Địa Điểm</th>
              <th className="px-5 py-3.5 font-medium">Thời Gian</th>
              <th className="px-5 py-3.5 font-medium text-right">Giá</th>
              <th className="px-5 py-3.5 font-medium">Đánh Giá</th>
              <th className="px-5 py-3.5 font-medium text-center">Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-500">Đang tải...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-500">Không tìm thấy tour nào</td></tr>
            ) : filtered.map((t) => (
              <tr key={t.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    {t.imageUrl && (
                      <img src={t.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    )}
                    <div>
                      <p className="text-white font-medium">{t.title}</p>
                      <p className="text-xs text-slate-500">{t.category || 'Chưa phân loại'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <MapPin size={14} />{t.location}
                  </div>
                </td>
                <td className="px-5 py-4 text-slate-400">{t.duration} ngày</td>
                <td className="px-5 py-4 text-right text-white font-medium">{fmt(t.price)}</td>
                <td className="px-5 py-4">
                  <span className="text-amber-400">★ {(t.rating || 0).toFixed(1)}</span>
                  <span className="text-slate-500 text-xs ml-1">({t.reviewCount || 0})</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button className="p-2 hover:bg-blue-500/10 rounded-lg text-blue-400 transition"><Pencil size={16} /></button>
                    <button onClick={() => handleDelete(t.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-red-400 transition"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
