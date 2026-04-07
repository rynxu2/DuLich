'use client';

import { useEffect, useState } from 'react';
import { notificationsApi } from '@/lib/api';
import { Bell, CheckCheck, Trash2, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const TYPE_STYLES: Record<string, { icon: any; color: string; bg: string }> = {
  BOOKING_CONFIRMED: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  BOOKING_CANCELLED: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  PAYMENT_SUCCESS: { icon: CheckCircle, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  SYSTEM: { icon: Info, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  WARNING: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

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
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { alert('Lỗi khi đánh dấu'); }
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
    if (diff < 60) return `${diff} phút trước`;
    if (diff < 1440) return `${Math.floor(diff / 60)} giờ trước`;
    return d.toLocaleDateString('vi-VN');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell size={20} className="text-slate-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-sm text-slate-400">{notifications.length} thông báo · {unreadCount} chưa đọc</span>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 rounded-xl text-sm font-medium transition">
            <CheckCheck size={16} /> Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Notification List */}
      <div className="space-y-2">
        {loading ? (
          <div className="py-16 text-center text-slate-500">Đang tải...</div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Bell size={48} strokeWidth={1} className="mx-auto mb-4 text-slate-700" />
            <p>Không có thông báo nào</p>
          </div>
        ) : notifications.map((n) => {
          const style = TYPE_STYLES[n.type] || TYPE_STYLES.SYSTEM;
          const IconComp = style.icon;
          return (
            <div key={n.id}
              className={`flex items-start gap-4 p-4 rounded-2xl border transition hover:border-white/10 cursor-pointer
                ${n.read ? 'bg-slate-900/30 border-white/5' : 'bg-slate-900/60 border-blue-500/20'}`}
              onClick={() => !n.read && handleMarkRead(n.id)}>
              <div className={`p-2.5 rounded-xl shrink-0 ${style.bg}`}>
                <IconComp size={18} className={style.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`text-sm font-medium ${n.read ? 'text-slate-400' : 'text-white'}`}>{n.title || n.type}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message || n.content}</p>
                  </div>
                  {!n.read && <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />}
                </div>
                <p className="text-xs text-slate-600 mt-2">{formatTime(n.createdAt)}</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                className="p-1.5 hover:bg-red-500/10 rounded-lg text-slate-600 hover:text-red-400 transition shrink-0">
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
