'use client';

import { useEffect, useState } from 'react';
import { expensesApi } from '@/lib/api';
import { CheckCircle, XCircle, Clock, DollarSign, ListFilter, CreditCard, X, ShieldAlert } from 'lucide-react';
import { Pagination } from '@/components/Pagination';

const CATEGORY_LABELS: Record<string, string> = {
  FOOD: '🍜 Ăn uống',
  TRANSPORT: '🚗 Di chuyển',
  ACCOMMODATION: '🏨 Lưu trú',
  TICKETS: '🎟 Vé tham quan',
  UNEXPECTED: '⚡ Phát sinh',
};

const STATUS_STYLES: Record<string, { icon: any; class: string; label: string }> = {
  PENDING: { icon: Clock, class: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20', label: 'Chờ duyệt' },
  APPROVED: { icon: CheckCircle, class: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20', label: 'Đã duyệt' },
  REJECTED: { icon: XCircle, class: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20', label: 'Từ chối' },
};

const SkeletonRow = () => (
  <tr className="animate-pulse border-b border-slate-100 dark:border-white/5">
    <td className="py-4 px-5"><div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-24" /></td>
    <td className="py-4 px-5">
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-48" />
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-24" />
      </div>
    </td>
    <td className="py-4 px-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20" /></td>
    <td className="py-4 px-5"><div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-24 ml-auto" /></td>
    <td className="py-4 px-5"><div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-24" /></td>
    <td className="py-4 px-5"><div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-32 mx-auto" /></td>
  </tr>
);

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = tab === 'pending' ? await expensesApi.getPending() : await expensesApi.list();
      setExpenses(Array.isArray(data) ? data : []);
    } catch { setExpenses([]); } finally { setLoading(false); }
  };

  useEffect(() => { 
    fetch(); 
    setCurrentPage(1);
  }, [tab]);

  const totalPages = Math.ceil(expenses.length / pageSize);
  const currentExpenses = expenses.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleApprove = async (id: number) => {
    try {
      await expensesApi.approve(id);
      setExpenses(expenses.map((e) => e.id === id ? { ...e, status: 'APPROVED' } : e));
    } catch { alert('Không thể duyệt chi phí'); }
  };

  const handleReject = async () => {
    if (!rejectId || !rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }
    setSaving(true);
    try {
      await expensesApi.reject(rejectId, rejectReason);
      setExpenses(expenses.map((e) => e.id === rejectId ? { ...e, status: 'REJECTED' } : e));
      setRejectId(null);
      setRejectReason('');
    } catch { alert('Không thể từ chối chi phí'); }
    finally { setSaving(false); }
  };

  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
  const totalPending = expenses.filter((e) => e.status === 'PENDING').reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Duyệt Chi Phí</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Quản lý và xét duyệt các chi phí phát sinh từ Tour</p>
        </div>
      </div>

      {/* Summary + Tabs */}
      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl w-full md:w-auto overflow-x-auto custom-scrollbar">
          <button onClick={() => setTab('pending')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 ${tab === 'pending' ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
            <Clock size={16} /> Chờ Duyệt
            {tab === 'pending' && <span className="ml-1.5 px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/20 text-xs">{expenses.length}</span>}
          </button>
          <button onClick={() => setTab('all')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 ${tab === 'all' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
            <ListFilter size={16} /> Tất Cả
          </button>
        </div>
        
        {tab === 'pending' && totalPending > 0 && (
          <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-5 py-2.5 rounded-2xl shadow-sm">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <DollarSign size={16} />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Cần duyệt chi</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{fmt(totalPending)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Expense Table */}
      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-white/5">
                <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider">Hạng Mục</th>
                <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider">Thông Tin Chi Tiết</th>
                <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider">Chuyến Đi</th>
                <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider text-right">Giá Trị</th>
                <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider">Trạng Thái</th>
                <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider text-center">Xử Lý</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="py-20 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                      <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                        <CreditCard size={32} className="text-slate-400 opacity-50" />
                      </div>
                      <p className="text-lg font-medium text-slate-900 dark:text-white">Không có phiếu chi nào</p>
                      <p className="text-sm mt-1">{tab === 'pending' ? 'Tuyệt vời, tất cả các khoản chi đã được xử lý!' : 'Chưa có khoản chi phí nào được ghi nhận.'}</p>
                    </div>
                  </td>
                </tr>
              ) : currentExpenses.map((e) => {
                const s = STATUS_STYLES[e.status] || STATUS_STYLES.PENDING;
                return (
                  <tr key={e.id} className="group border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700">
                        {CATEGORY_LABELS[e.category] || e.category}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-slate-900 dark:text-white font-medium max-w-xs truncate" title={e.description}>{e.description}</p>
                      {e.status === 'REJECTED' && e.rejectReason && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <ShieldAlert size={12} /> {e.rejectReason}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                        Tour #{e.tourId}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-slate-900 dark:text-white font-bold text-base">{fmt(e.amount)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${s.class}`}>
                        <s.icon size={14} /> {s.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {e.status === 'PENDING' ? (
                        <div className="flex items-center justify-center gap-2 transition-opacity">
                          <button onClick={() => handleApprove(e.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow">
                            <CheckCircle size={14} /> Duyệt
                          </button>
                          <button onClick={() => setRejectId(e.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow">
                            <XCircle size={14} /> Từ chối
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-slate-400">Đã xử lý</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          totalItems={expenses.length}
        />
      </div>

      {/* Reject Modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="text-red-500" size={24} /> Từ Chối Chi Phí
              </h3>
              <button onClick={() => { setRejectId(null); setRejectReason(''); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-4 rounded-xl text-sm text-red-800 dark:text-red-300">
                Bạn đang từ chối một khoản chi phí từ hướng dẫn viên. Vui lòng cung cấp lý do cụ thể để họ có thể điều chỉnh hoặc giải trình lại.
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Lý do từ chối <span className="text-red-500">*</span></label>
                <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ví dụ: Hóa đơn mờ không rõ số tiền, vượt quá định mức cho phép..." rows={4}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all resize-none text-sm" />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setRejectId(null); setRejectReason(''); }}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Hủy</button>
              <button onClick={handleReject} disabled={saving || !rejectReason.trim()}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2">
                {saving ? 'Đang xử lý...' : 'Xác nhận Từ Chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
