'use client';

import { useEffect, useState } from 'react';
import { toursApi } from '@/lib/api';
import { Plus, Pencil, Trash2, Search, MapPin, X, Image } from 'lucide-react';

interface TourForm {
  title: string;
  location: string;
  duration: number;
  price: number;
  description: string;
  category: string;
  imageUrl: string;
  maxGroupSize: number;
}

const EMPTY_FORM: TourForm = {
  title: '', location: '', duration: 1, price: 0, description: '',
  category: '', imageUrl: '', maxGroupSize: 20,
};

export default function ToursPage() {
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<TourForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchTours = async () => {
    setLoading(true);
    try {
      const { data } = await toursApi.list(search ? { keyword: search } : undefined);
      setTours(data || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchTours(); }, []);

  const filtered = tours.filter((t) =>
    !search || t.title?.toLowerCase().includes(search.toLowerCase()) ||
    t.location?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa tour này?')) return;
    try { await toursApi.delete(id); fetchTours(); } catch { alert('Không thể xóa tour'); }
  };

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (tour: any) => {
    setEditId(tour.id);
    setForm({
      title: tour.title || '',
      location: tour.location || '',
      duration: tour.duration || 1,
      price: tour.price || 0,
      description: tour.description || '',
      category: tour.category || '',
      imageUrl: tour.imageUrl || '',
      maxGroupSize: tour.maxGroupSize || 20,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.location.trim()) {
      alert('Vui lòng nhập Tên tour và Địa điểm');
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await toursApi.update(editId, form);
      } else {
        await toursApi.create(form);
      }
      setModalOpen(false);
      fetchTours();
    } catch {
      alert('Lỗi khi lưu tour');
    } finally { setSaving(false); }
  };

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

  const inputCls = 'w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition text-sm';
  const labelCls = 'block text-xs font-medium text-slate-400 mb-1.5';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tour..." onKeyDown={(e) => e.key === 'Enter' && fetchTours()}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
          />
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white text-sm font-medium transition">
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
                    {t.imageUrl ? (
                      <img src={t.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                        <Image size={16} className="text-slate-600" />
                      </div>
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
                    <button onClick={() => openEdit(t)} className="p-2 hover:bg-blue-500/10 rounded-lg text-blue-400 transition"><Pencil size={16} /></button>
                    <button onClick={() => handleDelete(t.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-red-400 transition"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Tour Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white">{editId ? 'Sửa Tour' : 'Thêm Tour Mới'}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={labelCls}>Tên Tour *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="VD: Hà Giang Loop 3 ngày" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Địa Điểm *</label>
                  <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Hà Giang" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Danh mục</label>
                  <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Mạo hiểm" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Thời gian (ngày)</label>
                  <input type="number" min={1} value={form.duration} onChange={(e) => setForm({ ...form, duration: +e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Giá (VNĐ)</label>
                  <input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Max nhóm</label>
                  <input type="number" min={1} value={form.maxGroupSize} onChange={(e) => setForm({ ...form, maxGroupSize: +e.target.value })}
                    className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>URL Hình ảnh</label>
                <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://..." className={inputCls} />
                {form.imageUrl && (
                  <img src={form.imageUrl} alt="preview" className="mt-2 w-full h-32 object-cover rounded-xl border border-white/5" />
                )}
              </div>
              <div>
                <label className={labelCls}>Mô tả</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Mô tả chi tiết tour..." rows={3}
                  className={inputCls + ' resize-none'} />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/5">
              <button onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 text-sm text-slate-400 hover:bg-white/5 rounded-xl transition">Hủy</button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition">
                {saving ? 'Đang lưu...' : editId ? 'Cập Nhật' : 'Tạo Tour'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
