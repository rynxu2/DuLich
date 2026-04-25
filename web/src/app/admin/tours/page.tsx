'use client';

import { useEffect, useState } from 'react';
import { toursApi, storageApi } from '@/lib/api';
import { Plus, Pencil, Trash2, Search, MapPin, X, Image as ImageIcon, Map, Star, CalendarDays, Users } from 'lucide-react';
import { Pagination } from '@/components/Pagination';

interface TourForm {
  title: string;
  location: string;
  duration: number;
  price: number;
  description: string;
  category: string;
  imageUrl: string;
  maxParticipants: number;
  isActive: boolean;
  itinerary: Array<{ title: string; content: string }>;
}

const EMPTY_FORM: TourForm = {
  title: '', location: '', duration: 1, price: 0, description: '',
  category: '', imageUrl: '', maxParticipants: 30, isActive: true, 
  itinerary: [{ title: 'Ngày 1', content: '' }]
};

const SkeletonRow = () => (
  <tr className="animate-pulse border-b border-slate-100 dark:border-white/5">
    <td className="py-4 px-5">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-40" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-20" />
        </div>
      </div>
    </td>
    <td className="py-4 px-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" /></td>
    <td className="py-4 px-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16" /></td>
    <td className="py-4 px-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24 ml-auto" /></td>
    <td className="py-4 px-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16" /></td>
    <td className="py-4 px-5"><div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-20 mx-auto" /></td>
  </tr>
);

export default function ToursPage() {
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<TourForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const res = await storageApi.upload(file, 'tour', String(editId || 0));
      setForm({ ...form, imageUrl: res.data.url });
    } catch (err) {
      alert('Lỗi khi tải ảnh lên');
    } finally {
      setUploading(false);
    }
  };

  const fetchTours = async () => {
    setLoading(true);
    try {
      const { data } = await toursApi.list(search ? { keyword: search } : undefined);
      setTours(data || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchTours(); }, []);

  const filtered = tours.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.location.toLowerCase().includes(search.toLowerCase())
  );
  
  const totalPages = Math.ceil(filtered.length / pageSize);
  const currentTours = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => { setCurrentPage(1); }, [search]);

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
      maxParticipants: tour.maxParticipants || 30,
      isActive: tour.isActive !== false,
      itinerary: tour.itinerary 
        ? Object.entries(tour.itinerary).map(([k, v]) => ({ title: k, content: String(v) }))
        : [{ title: 'Ngày 1', content: '' }],
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
      const payload = {
        ...form,
        itinerary: (form.itinerary || []).reduce((acc: any, curr: any) => {
          if (curr.title.trim()) acc[curr.title.trim()] = curr.content;
          return acc;
        }, {} as Record<string, string>)
      };
      
      if (editId) {
        await toursApi.update(editId, payload);
      } else {
        await toursApi.create(payload);
      }
      setModalOpen(false);
      fetchTours();
    } catch {
      alert('Lỗi khi lưu tour');
    } finally { setSaving(false); }
  };

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

  const inputCls = 'w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition text-sm';
  const labelCls = 'block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5';

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Danh Sách Tour</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Quản lý các chương trình du lịch</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên tour, địa điểm..." onKeyDown={(e) => e.key === 'Enter' && fetchTours()}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all"
          />
        </div>
        <button onClick={openCreate}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-xl text-white text-sm font-bold shadow-sm shadow-blue-500/20 hover:shadow-md hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all">
          <Plus size={18} /> Thêm Tour Mới
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-white/5">
                <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider">Thông Tin Tour</th>
                <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider">Địa Điểm</th>
                <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider">Thời Gian</th>
                <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider text-right">Giá</th>
                <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider">Đánh Giá</th>
                <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider text-center">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <SkeletonRow /><SkeletonRow /><SkeletonRow /><SkeletonRow />
                </>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="py-20 flex flex-col items-center justify-center">
                      <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                        <Map size={32} className="text-slate-400 dark:text-slate-500" />
                      </div>
                      <p className="text-slate-900 dark:text-white font-medium text-lg">Không tìm thấy tour nào</p>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">Thử thay đổi từ khóa tìm kiếm</p>
                    </div>
                  </td>
                </tr>
              ) : currentTours.map((t) => (
                <tr key={t.id} className="group border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-4">
                      {t.imageUrl ? (
                        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-white/10 shadow-sm group-hover:shadow-md transition-shadow">
                          <img src={t.imageUrl} alt={t.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0">
                          <ImageIcon size={20} className="text-slate-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-slate-900 dark:text-white font-semibold truncate hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors" title={t.title} onClick={() => openEdit(t)}>
                          {t.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider
                            ${t.isActive !== false ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                            {t.isActive !== false ? 'Hoạt động' : 'Tạm ẩn'}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {t.category || 'Chưa phân loại'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                      <MapPin size={16} className="text-slate-400" />{t.location}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700">
                      {t.duration} ngày
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="font-bold text-slate-900 dark:text-white">{fmt(t.price)}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <Star size={16} className="fill-amber-400 text-amber-400" />
                      <span className="font-bold text-slate-900 dark:text-white">{(t.rating || 0).toFixed(1)}</span>
                      <span className="text-slate-500 dark:text-slate-400 text-xs">({t.reviewCount || 0})</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2 transition-opacity">
                      <button onClick={() => openEdit(t)} 
                        className="p-2 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 dark:text-slate-400 dark:hover:text-blue-400 rounded-xl transition-colors"
                        title="Sửa">
                        <Pencil size={18} />
                      </button>
                      <button onClick={() => handleDelete(t.id)} 
                        className="p-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:text-slate-400 dark:hover:text-red-400 rounded-xl transition-colors"
                        title="Xóa">
                        <Trash2 size={18} />
                      </button>
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

      {/* Create/Edit Tour Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 dark:border-white/5 shrink-0">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{editId ? 'Chỉnh Sửa Tour' : 'Tạo Tour Mới'}</h3>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              {/* Form content goes here, unchanged but styled */}
              <div className="space-y-6">
                <div>
                  <label className={labelCls}>Tên Tour <span className="text-red-500">*</span></label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="VD: Khám phá Hà Giang 3 ngày 2 đêm" className={inputCls} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelCls}>Địa Điểm <span className="text-red-500">*</span></label>
                    <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="VD: Hà Giang" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Danh Mục</label>
                    <div className="relative">
                      <select 
                        value={form.category} 
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className={inputCls + " appearance-none cursor-pointer pr-10"}
                      >
                        <option value="" disabled>Chọn danh mục</option>
                        <option value="adventure">Mạo hiểm (Adventure)</option>
                        <option value="relaxation">Nghỉ dưỡng (Relaxation)</option>
                        <option value="culture">Văn hóa (Culture)</option>
                        <option value="nature">Thiên nhiên (Nature)</option>
                        <option value="city">Khám phá (City)</option>
                        <option value="food">Ẩm thực (Food)</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className={labelCls}>Thời Gian (ngày)</label>
                    <div className="relative">
                      <input type="number" min={1} value={form.duration} onChange={(e) => setForm({ ...form, duration: +e.target.value })}
                        className={inputCls + " pl-10"} />
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><CalendarDays size={16} /></div>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Giá (VNĐ)</label>
                    <input type="number" min={0} value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Khách Tối Đa</label>
                    <div className="relative">
                      <input type="number" min={1} value={form.maxParticipants} onChange={(e) => setForm({ ...form, maxParticipants: +e.target.value })}
                        className={inputCls + " pl-10"} />
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Users size={16} /></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      id="isActive"
                      checked={form.isActive} 
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label htmlFor="isActive" className="text-sm font-bold text-slate-900 dark:text-white cursor-pointer block">
                      Kích hoạt tour
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Tour sẽ được hiển thị công khai trên ứng dụng nếu được kích hoạt</p>
                  </div>
                </div>
                
                <div>
                  <label className={labelCls}>Hình Ảnh Tour</label>
                  {!form.imageUrl ? (
                    <label className="cursor-pointer flex flex-col items-center justify-center w-full h-32 px-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl transition-colors">
                      <ImageIcon size={28} className="text-slate-400 mb-2" />
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        {uploading ? 'Đang xử lý ảnh...' : 'Bấm để tải ảnh lên'}
                      </span>
                      <span className="text-xs text-slate-500 mt-1">PNG, JPG, WebP (Tối đa 5MB)</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        className="hidden" 
                        onChange={handleUploadImage}
                        disabled={uploading}
                      />
                    </label>
                  ) : (
                    <div className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                      <img src={form.imageUrl} alt="preview" className="w-full h-48 object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <button 
                          onClick={() => setForm({ ...form, imageUrl: '' })}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                          <Trash2 size={16} /> Gỡ ảnh này
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className={labelCls}>Mô Tả Chi Tiết</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Mô tả hấp dẫn về tour để thu hút khách hàng..." rows={4}
                    className={inputCls + ' resize-none'} />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className={labelCls + " mb-0"}>Lịch Trình Từng Ngày</label>
                    <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-lg">
                      {form.itinerary?.length || 0} Ngày
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    {(form.itinerary || []).map((day: any, index: number) => (
                      <div key={index} className="relative p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm group">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 text-xs">
                              {index + 1}
                            </span>
                            Ngày {index + 1}
                          </h4>
                          {form.itinerary.length > 1 && (
                            <button 
                              onClick={() => {
                                const newItin = form.itinerary.filter((_, i) => i !== index);
                                setForm({ ...form, itinerary: newItin });
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Xóa ngày này"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                        <div className="space-y-4">
                          <div>
                            <input 
                              value={day.title}
                              onChange={(e) => {
                                const newItin = [...form.itinerary];
                                newItin[index].title = e.target.value;
                                setForm({ ...form, itinerary: newItin });
                              }}
                              placeholder={`VD: Di chuyển tới Hà Giang & Nhận phòng`}
                              className={inputCls + " font-medium"}
                            />
                          </div>
                          <div>
                            <textarea 
                              value={day.content}
                              onChange={(e) => {
                                const newItin = [...form.itinerary];
                                newItin[index].content = e.target.value;
                                setForm({ ...form, itinerary: newItin });
                              }}
                              placeholder="Mô tả chi tiết các hoạt động trong ngày..."
                              rows={3}
                              className={inputCls + " resize-none"}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        const next = form.itinerary.length + 1;
                        setForm({ ...form, itinerary: [...form.itinerary, { title: `Ngày ${next}`, content: '' }] });
                      }}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 font-bold rounded-2xl transition-colors border border-dashed border-blue-200 dark:border-blue-500/30 w-full justify-center"
                    >
                      <Plus size={18} /> Thêm Ngày Mới
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-slate-100 dark:border-white/5 shrink-0 bg-slate-50 dark:bg-slate-800/30 rounded-b-3xl">
              <button onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
                Hủy bỏ
              </button>
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2">
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang lưu...
                  </>
                ) : editId ? 'Cập Nhật Tour' : 'Tạo Tour Ngay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
