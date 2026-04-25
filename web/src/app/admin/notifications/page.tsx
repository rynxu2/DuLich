'use client';

import { useEffect, useState } from 'react';
import { notificationsApi } from '@/lib/api';
import { Bell, CheckCheck, Trash2, Info, AlertTriangle, CheckCircle, XCircle, BellRing, Clock } from 'lucide-react';

const TYPE_STYLES: Record<string, { icon: any; color: string; bg: string }> = {
  BOOKING_CONFIRMED: { icon: CheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  BOOKING_CANCELLED: { icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10' },
  PAYMENT_SUCCESS: { icon: CheckCircle, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  SYSTEM: { icon: Info, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-500/10' },
  WARNING: { icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
};

const SkeletonNotification = () => (
  <div className="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 animate-pulse">
    <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
    <div className="flex-1 space-y-3 py-1">
      <div className="flex justify-between">
        <div className="w-1/3 h-5 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </div>
      <div className="w-3/4 h-4 bg-slate-200 dark:bg-slate-800 rounded-lg" />
    </div>
  </div>
);

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMarking, setIsMarking] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [n, u] = await Promise.allSettled([
        notificationsApi.list(),
        notificationsApi.getUnreadCount(),
      ]);
      if (n.status === 'fulfilled') setNotifications(Array.isArray(n.value.data) ? n.value.data : []);
      if (u.status === 'fulfilled') setUnreadCount(u.value.data?.count || u.value.data?.unreadCount || 0);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleMarkAllRead = async () => {
    if (isMarking) return;
    setIsMarking(true);
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { 
      alert('Lỗi khi đánh dấu'); 
    } finally {
      setIsMarking(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(notifications.map((n) => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch {}
  };

  const handleDelete = async (id: number) => {
    try {
      await notificationsApi.delete(id);
      const removed = notifications.find((n) => n.id === id);
      setNotifications(notifications.filter((n) => n.id !== id));
      if (removed && !removed.read) setUnreadCount(Math.max(0, unreadCount - 1));
    } catch { alert('Lỗi khi xóa'); }
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diff < 1) return 'Vừa xong';
    if (diff < 60) return `${diff} phút trước`;
    if (diff < 1440) return `${Math.floor(diff / 60)} giờ trước`;
    if (diff < 2880) return `Hôm qua, ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center">
              <BellRing size={28} className="text-blue-600 dark:text-blue-400" />
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full text-xs text-white flex items-center justify-center font-bold shadow-sm">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Thông Báo</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Bạn có <strong className="text-slate-700 dark:text-slate-200">{unreadCount}</strong> thông báo chưa đọc trên tổng số {notifications.length}
            </p>
          </div>
        </div>
        
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllRead}
            disabled={isMarking}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
          >
            <CheckCheck size={18} /> {isMarking ? 'Đang xử lý...' : 'Đánh dấu tất cả đã đọc'}
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="space-y-4">
        {loading ? (
          <>
            <SkeletonNotification />
            <SkeletonNotification />
            <SkeletonNotification />
            <SkeletonNotification />
          </>
        ) : notifications.length === 0 ? (
          <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl py-20 px-6 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
              <Bell size={40} className="text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Chưa có thông báo nào</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm">
              Khi có hoạt động mới như khách đặt tour hoặc thanh toán, thông báo sẽ xuất hiện tại đây.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
            {notifications.map((n, idx) => {
              const style = TYPE_STYLES[n.type] || TYPE_STYLES.SYSTEM;
              const IconComp = style.icon;
              const isLast = idx === notifications.length - 1;
              
              return (
                <div key={n.id}
                  className={`group relative flex items-start gap-4 p-5 sm:p-6 transition-colors duration-300
                    ${!isLast ? 'border-b border-slate-100 dark:border-white/5' : ''}
                    ${n.read 
                      ? 'bg-transparent hover:bg-slate-50 dark:hover:bg-white/[0.02]' 
                      : 'bg-blue-50/30 dark:bg-blue-500/5 hover:bg-blue-50/60 dark:hover:bg-blue-500/10 cursor-pointer'
                    }`}
                  onClick={() => !n.read && handleMarkRead(n.id)}>
                  
                  {/* Unread Indicator Bar */}
                  {!n.read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full" />
                  )}

                  <div className={`p-3 rounded-2xl shrink-0 mt-1 ${style.bg}`}>
                    <IconComp size={20} className={style.color} />
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4 mb-1">
                      <h4 className={`text-base font-semibold truncate ${n.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                        {n.title || n.type}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
                        <Clock size={12} />
                        {formatTime(n.createdAt)}
                      </div>
                    </div>
                    
                    <p className={`text-sm leading-relaxed ${n.read ? 'text-slate-500 dark:text-slate-400' : 'text-slate-700 dark:text-slate-300 font-medium'}`}>
                      {n.message || n.content}
                    </p>
                  </div>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-all
                      opacity-100`}
                    title="Xóa thông báo"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
