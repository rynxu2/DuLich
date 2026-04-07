'use client';

import { useEffect, useState } from 'react';
import { reviewsApi, toursApi } from '@/lib/api';
import { Star, Trash2, Search, MessageSquare, User } from 'lucide-react';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTour, setSelectedTour] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await toursApi.list();
        setTours(Array.isArray(data) ? data : []);
      } catch {} finally { setLoading(false); }
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

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '0';

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} size={14} className={s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-700'} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Tour List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tour..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:ring-2 focus:ring-blue-500/50 focus:outline-none" />
          </div>
          <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden max-h-[70vh] overflow-y-auto">
            {filteredTours.length === 0 ? (
              <p className="py-8 text-center text-slate-500 text-sm">Không có tour</p>
            ) : filteredTours.map((t) => (
              <button key={t.id} onClick={() => loadReviews(t.id)}
                className={`w-full text-left px-4 py-3.5 border-b border-white/5 hover:bg-white/[0.03] transition flex items-center gap-3 ${selectedTour === t.id ? 'bg-blue-500/10 border-l-2 border-l-blue-500' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{t.title}</p>
                  <p className="text-xs text-slate-500">{t.location}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 text-amber-400 text-xs">
                    <Star size={10} className="fill-amber-400" />
                    {(t.rating || 0).toFixed(1)}
                  </div>
                  <p className="text-xs text-slate-500">{t.reviewCount || 0} đánh giá</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Reviews */}
        <div className="lg:col-span-2">
          {!selectedTour ? (
            <div className="bg-slate-900/50 border border-white/5 rounded-2xl h-[70vh] flex flex-col items-center justify-center text-slate-500">
              <MessageSquare size={48} strokeWidth={1} className="mb-4" />
              <p className="text-sm">Chọn một tour để xem đánh giá</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stats */}
              <div className="flex items-center gap-6 bg-slate-900/50 border border-white/5 rounded-2xl px-6 py-4">
                <div>
                  <p className="text-3xl font-bold text-white">{avgRating}</p>
                  <div className="mt-1">{renderStars(Math.round(Number(avgRating)))}</div>
                </div>
                <div className="text-sm text-slate-400">
                  <p><strong className="text-white">{reviews.length}</strong> đánh giá</p>
                  <p className="text-xs mt-1">
                    {tours.find((t) => t.id === selectedTour)?.title || `Tour #${selectedTour}`}
                  </p>
                </div>
              </div>

              {/* Review Cards */}
              <div className="space-y-3 max-h-[58vh] overflow-y-auto">
                {loading ? (
                  <div className="py-12 text-center text-slate-500">Đang tải...</div>
                ) : reviews.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">Tour này chưa có đánh giá</div>
                ) : reviews.map((r) => (
                  <div key={r.id} className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-500/15 flex items-center justify-center text-violet-400 text-sm font-bold">
                          <User size={16} />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">User #{r.userId}</p>
                          <p className="text-xs text-slate-500">{r.createdAt?.split('T')[0] || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {renderStars(r.rating)}
                        <button onClick={() => handleDelete(r.id)}
                          className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-400 transition">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    {r.comment && <p className="text-slate-300 text-sm leading-relaxed">{r.comment}</p>}
                    {r.imageUrls && r.imageUrls.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {r.imageUrls.map((url: string, idx: number) => (
                          <img key={idx} src={url} alt="" className="w-16 h-16 rounded-lg object-cover border border-white/5" />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
