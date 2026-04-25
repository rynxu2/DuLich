'use client';

import { useEffect, useState } from 'react';
import { reviewsApi, toursApi } from '@/lib/api';
import { Star, Trash2, Search, MessageSquare, User, Info, Map } from 'lucide-react';
import { Pagination } from '@/components/Pagination';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTour, setSelectedTour] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [reviewsPage, setReviewsPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    (async () => {
      try {
        const { data } = await toursApi.list();
        const list = Array.isArray(data) ? data : [];
        setTours(list);
        if (list.length === 0) setError('Chưa có tour nào trong hệ thống');
      } catch (err: any) {
        console.error('Failed to load tours:', err);
        setError('Không thể tải danh sách tour. Kiểm tra kết nối backend.');
      } finally { setLoading(false); }
    })();
  }, []);

  const loadReviews = async (tourId: number) => {
    setSelectedTour(tourId);
    setLoading(true);
    try {
      const { data } = await reviewsApi.getByTour(tourId);
      setReviews(Array.isArray(data) ? data : []);
    } catch { setReviews([]); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa đánh giá này?')) return;
    try {
      await reviewsApi.delete(id);
      setReviews(reviews.filter((r) => r.id !== id));
    } catch { alert('Không thể xóa'); }
  };

  const filteredTours = tours.filter((t) =>
    !search || t.title?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(reviews.length / pageSize);
  const currentReviews = reviews.slice((reviewsPage - 1) * pageSize, reviewsPage * pageSize);
  useEffect(() => { setReviewsPage(1); }, [selectedTour]);

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '0';

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} size={14} className={s <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200 dark:text-slate-700'} />
        ))}
      </div>
    );
  };

  const selectedTourData = tours.find((t) => t.id === selectedTour);

  return (
    <div className="space-y-6 pb-10 h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Đánh Giá & Phản Hồi</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Xem và quản lý nhận xét của khách hàng theo từng tour</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left: Tour List */}
        <div className="lg:col-span-4 flex flex-col h-full bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 dark:border-white/5 shrink-0 bg-slate-50/50 dark:bg-slate-800/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tour..."
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all shadow-sm" />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading && !selectedTour ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800/50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
                <Info size={32} className="text-red-400 mb-3" />
                <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
                <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors">
                  Thử lại
                </button>
              </div>
            ) : filteredTours.length === 0 ? (
              <div className="py-12 px-6 flex flex-col items-center justify-center text-center opacity-60">
                <Map size={32} className="text-slate-400 mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">Không tìm thấy tour nào</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredTours.map((t) => {
                  const isSelected = selectedTour === t.id;
                  return (
                    <button key={t.id} onClick={() => loadReviews(t.id)}
                      className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 group
                        ${isSelected 
                          ? 'bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 shadow-sm' 
                          : 'border border-transparent hover:bg-slate-50 dark:hover:bg-white/[0.02]'}`}>
                      
                      <div className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center border transition-colors
                        ${isSelected ? 'bg-white dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/30' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/5 group-hover:bg-white dark:group-hover:bg-slate-700'}`}>
                        <Map className={isSelected ? 'text-blue-500' : 'text-slate-400'} size={18} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate transition-colors ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                          {t.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{t.location}</p>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <div className="flex items-center justify-end gap-1 text-amber-500 text-xs font-bold bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-100 dark:border-amber-500/20">
                          <Star size={10} className="fill-amber-500" />
                          {(t.rating || 0).toFixed(1)}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                          {t.reviewCount || 0} Đ.Giá
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Reviews */}
        <div className="lg:col-span-8 flex flex-col h-full bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl shadow-sm overflow-hidden">
          {!selectedTour ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-6 opacity-60">
              <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                <MessageSquare size={40} className="text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Chưa chọn tour</h3>
              <p className="text-sm text-center max-w-sm">Chọn một tour từ danh sách bên trái để xem các đánh giá và phản hồi của khách hàng.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Stats Header */}
              <div className="shrink-0 flex items-center justify-between p-6 md:p-8 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/40 dark:to-slate-900/40 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-6">
                  <div className="text-center bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5">
                    <p className="text-4xl font-extrabold text-slate-900 dark:text-white mb-1">{avgRating}</p>
                    <div className="flex justify-center">{renderStars(Math.round(Number(avgRating)))}</div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{selectedTourData?.title || `Tour #${selectedTour}`}</h2>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                        {reviews.length} đánh giá
                      </span>
                      <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Map size={14} /> {selectedTourData?.location || 'Chưa xác định'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Review Cards */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="p-6 border border-slate-100 dark:border-white/5 rounded-2xl bg-slate-50 dark:bg-slate-800/30 animate-pulse">
                        <div className="flex justify-between mb-4">
                          <div className="flex gap-3"><div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full" /><div className="space-y-2"><div className="w-24 h-4 bg-slate-200 dark:bg-slate-700 rounded" /><div className="w-16 h-3 bg-slate-200 dark:bg-slate-700 rounded" /></div></div>
                          <div className="w-24 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                        </div>
                        <div className="space-y-2"><div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded" /><div className="w-3/4 h-3 bg-slate-200 dark:bg-slate-700 rounded" /></div>
                      </div>
                    ))}
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 opacity-60">
                    <Star size={48} className="mb-4 text-slate-300 dark:text-slate-600" />
                    <p className="font-medium text-lg text-slate-900 dark:text-white">Tour này chưa có đánh giá nào</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {currentReviews.map((r) => (
                      <div key={r.id} className="group bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-2xl p-6 hover:shadow-md dark:hover:border-white/10 hover:border-slate-300 transition-all">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-500/20 dark:to-fuchsia-500/20 flex items-center justify-center text-violet-700 dark:text-violet-300 text-sm font-bold shadow-sm">
                              <User size={18} />
                            </div>
                            <div>
                              <p className="text-slate-900 dark:text-white text-sm font-bold">Khách Hàng #{r.userId}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{r.createdAt?.split('T')[0] || '—'}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-100 dark:border-amber-500/20">
                              {renderStars(r.rating)}
                            </div>
                            <button onClick={() => handleDelete(r.id)}
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition"
                              title="Xóa đánh giá"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        
                        {r.comment && (
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                            <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{r.comment}</p>
                          </div>
                        )}
                        
                        {r.imageUrls && r.imageUrls.length > 0 && (
                          <div className="flex flex-wrap gap-3 mt-4">
                            {r.imageUrls.map((url: string, idx: number) => (
                              <a key={idx} href={url} target="_blank" rel="noreferrer" className="block relative group/img overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
                                <img src={url} alt="" className="w-20 h-20 object-cover group-hover/img:scale-110 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {reviews.length > 0 && (
                <div className="shrink-0">
                  <Pagination 
                    currentPage={reviewsPage}
                    totalPages={totalPages}
                    onPageChange={setReviewsPage}
                    pageSize={pageSize}
                    totalItems={reviews.length}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
