'use client';

import { useEffect, useState } from 'react';
import { expensesApi } from '@/lib/api';
import { CheckCircle, XCircle, Clock, DollarSign, Filter } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  FOOD: '🍜 Ăn uống',
  TRANSPORT: '🚗 Di chuyển',
  ACCOMMODATION: '🏨 Lưu trú',
  TICKETS: '🎟 Vé tham quan',
  UNEXPECTED: '⚡ Phát sinh',
};

const STATUS_STYLES: Record<string, { icon: any; class: string; label: string }> = {
  PENDING: { icon: Clock, class: 'text-amber-400 bg-amber-500/10', label: 'Chờ duyệt' },
  APPROVED: { icon: CheckCircle, class: 'text-emerald-400 bg-emerald-500/10', label: 'Đã duyệt' },
  REJECTED: { icon: XCircle, class: 'text-red-400 bg-red-500/10', label: 'Từ chối' },
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = tab === 'pending' ? await expensesApi.getPending() : await expensesApi.list();
      setExpenses(Array.isArray(data) ? data : []);
    } catch { setExpenses([]); } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [tab]);

  const handleApprove = async (id: number) => {
    try {
      await expensesApi.approve(id);
      setExpenses(expenses.map((e) => e.id === id ? { ...e, status: 'APPROVED' } : e));
    } catch { alert('Không thể duyệt chi phí'); }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    try {
      await expensesApi.reject(rejectId, rejectReason);
      setExpenses(expenses.map((e) => e.id === rejectId ? { ...e, status: 'REJECTED' } : e));
      setRejectId(null);
      setRejectReason('');
    } catch { alert('Không thể từ chối chi phí'); }
  };

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
  const totalPending = expenses.filter((e) => e.status === 'PENDING').reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div className="space-y-5">
      {/* Summary + Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex gap-2">
          <button onClick={() => setTab('pending')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            <Clock size={14} className="inline mr-1.5" />Chờ Duyệt
          </button>
          <button onClick={() => setTab('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === 'all' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            Tất Cả
          </button>
        </div>
        {tab === 'pending' && (
          <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-500/10 px-4 py-2 rounded-xl">
            <DollarSign size={16} /> Tổng chờ duyệt: <span className="font-bold">{fmt(totalPending)}</span>
          </div>
        )}
      </div>

      {/* Expense Table */}
      <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 bg-slate-900/50">
              <th className="px-5 py-3.5 font-medium">Loại</th>
              <th className="px-5 py-3.5 font-medium">Mô Tả</th>
              <th className="px-5 py-3.5 font-medium">Tour</th>
              <th className="px-5 py-3.5 font-medium text-right">Số Tiền</th>
              <th className="px-5 py-3.5 font-medium">Trạng Thái</th>
              <th className="px-5 py-3.5 font-medium text-center">Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-500">Đang tải...</td></tr>
            ) : expenses.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-500">Không có chi phí nào</td></tr>
            ) : expenses.map((e) => {
              const s = STATUS_STYLES[e.status] || STATUS_STYLES.PENDING;
              return (
                <tr key={e.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                  <td className="px-5 py-4 text-white">{CATEGORY_LABELS[e.category] || e.category}</td>
                  <td className="px-5 py-4 text-slate-400 max-w-xs truncate">{e.description}</td>
                  <td className="px-5 py-4 text-slate-400">Tour #{e.tourId}</td>
                  <td className="px-5 py-4 text-right text-white font-medium">{fmt(e.amount)}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${s.class}`}>
                      <s.icon size={12} /> {s.label}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    {e.status === 'PENDING' && (
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => handleApprove(e.id)}
                          className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/20 transition">
                          Duyệt
                        </button>
                        <button onClick={() => setRejectId(e.id)}
                          className="px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/20 transition">
                          Từ chối
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Reject Modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">Từ Chối Chi Phí</h3>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Lý do từ chối..." rows={3}
              className="w-full p-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50" />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => { setRejectId(null); setRejectReason(''); }}
                className="px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 rounded-xl transition">Hủy</button>
              <button onClick={handleReject}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-xl transition">Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
