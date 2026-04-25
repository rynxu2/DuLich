'use client';

import { useEffect, useState } from 'react';
import { pricingApi } from '@/lib/api';
import { Plus, Trash2, Tag, Calendar, Users as UsersIcon, Baby, Zap, Clock, X, Percent, DollarSign, ListFilter, Scissors } from 'lucide-react';

const RULE_TYPE_INFO: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  SEASONAL: { label: 'Mùa vụ', icon: Calendar, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' },
  GROUP: { label: 'Nhóm', icon: UsersIcon, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20' },
  AGE: { label: 'Độ tuổi', icon: Baby, color: 'text-pink-600 dark:text-pink-400', bgColor: 'bg-pink-50 dark:bg-pink-500/10 border-pink-200 dark:border-pink-500/20' },
  EARLYBIRD: { label: 'Early Bird', icon: Clock, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' },
  LASTMINUTE: { label: 'Last Minute', icon: Zap, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20' },
  PROMO: { label: 'Promo', icon: Tag, color: 'text-violet-600 dark:text-violet-400', bgColor: 'bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20' },
};

const EMPTY_RULE = { name: '', type: 'SEASONAL', modifierType: 'PERCENTAGE', modifierValue: 0, priority: 1, isActive: true, conditions: '' };
const EMPTY_PROMO = { code: '', description: '', discountPercent: 10, maxUses: 100, validFrom: '', validUntil: '' };

const SkeletonRuleCard = () => (
  <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-6 animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="w-20 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
    </div>
    <div className="w-3/4 h-5 bg-slate-200 dark:bg-slate-800 rounded mb-6" />
    <div className="space-y-3">
      <div className="flex justify-between"><div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded" /><div className="w-12 h-4 bg-slate-200 dark:bg-slate-800 rounded" /></div>
      <div className="flex justify-between"><div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded" /><div className="w-12 h-4 bg-slate-200 dark:bg-slate-800 rounded" /></div>
      <div className="flex justify-between"><div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded" /><div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded" /></div>
    </div>
  </div>
);

const SkeletonPromoRow = () => (
  <tr className="animate-pulse border-b border-slate-100 dark:border-white/5">
    <td className="py-4 px-5"><div className="w-24 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg" /></td>
    <td className="py-4 px-5"><div className="w-48 h-4 bg-slate-200 dark:bg-slate-800 rounded" /></td>
    <td className="py-4 px-5"><div className="w-12 h-5 bg-slate-200 dark:bg-slate-800 rounded" /></td>
    <td className="py-4 px-5"><div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded" /></td>
    <td className="py-4 px-5"><div className="w-32 h-4 bg-slate-200 dark:bg-slate-800 rounded" /></td>
    <td className="py-4 px-5"><div className="w-8 h-8 mx-auto bg-slate-200 dark:bg-slate-800 rounded-lg" /></td>
  </tr>
);

export default function PricingPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'rules' | 'promos'>('rules');
  const [ruleModal, setRuleModal] = useState(false);
  const [promoModal, setPromoModal] = useState(false);
  const [ruleForm, setRuleForm] = useState(EMPTY_RULE);
  const [promoForm, setPromoForm] = useState(EMPTY_PROMO);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [r, p] = await Promise.allSettled([pricingApi.listRules(), pricingApi.listPromos()]);
      if (r.status === 'fulfilled') setRules(Array.isArray(r.value.data) ? r.value.data : []);
      if (p.status === 'fulfilled') setPromos(Array.isArray(p.value.data) ? p.value.data : []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDeleteRule = async (id: number) => {
    if (!confirm('Xóa rule này?')) return;
    try { await pricingApi.deleteRule(id); setRules(rules.filter((r) => r.id !== id)); } catch {}
  };

  const handleDeletePromo = async (id: number) => {
    if (!confirm('Xóa promo code này?')) return;
    try { await pricingApi.deletePromo(id); setPromos(promos.filter((p) => p.id !== id)); } catch {}
  };

  const handleCreateRule = async () => {
    if (!ruleForm.name.trim()) { alert('Vui lòng nhập tên rule'); return; }
    setSaving(true);
    try {
      const payload = {
        ...ruleForm,
        conditions: ruleForm.conditions ? JSON.parse(ruleForm.conditions) : null,
      };
      await pricingApi.createRule(payload);
      setRuleModal(false);
      setRuleForm(EMPTY_RULE);
      fetchData();
    } catch { alert('Lỗi khi tạo rule. Kiểm tra lại JSON conditions.'); }
    finally { setSaving(false); }
  };

  const handleCreatePromo = async () => {
    if (!promoForm.code.trim()) { alert('Vui lòng nhập mã code'); return; }
    setSaving(true);
    try {
      await pricingApi.createPromo(promoForm);
      setPromoModal(false);
      setPromoForm(EMPTY_PROMO);
      fetchData();
    } catch { alert('Lỗi khi tạo promo code'); }
    finally { setSaving(false); }
  };

  const inputCls = 'w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-sm font-medium';
  const labelCls = 'block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider';

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Chiến Lược Giá</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Quản lý quy tắc tính giá và mã khuyến mãi</p>
        </div>
      </div>

      {/* Tabs + Add buttons */}
      <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl w-full md:w-auto overflow-x-auto custom-scrollbar">
          <button onClick={() => setTab('rules')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 ${tab === 'rules' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
            <ListFilter size={16} /> Quy tắc Giá ({rules.length})
          </button>
          <button onClick={() => setTab('promos')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 ${tab === 'promos' ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
            <Scissors size={16} /> Mã Giảm Giá ({promos.length})
          </button>
        </div>
        
        {tab === 'rules' ? (
          <button onClick={() => { setRuleForm(EMPTY_RULE); setRuleModal(true); }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-bold rounded-xl shadow-sm shadow-blue-500/20 hover:shadow-md hover:-translate-y-0.5 transition-all w-full md:w-auto">
            <Plus size={18} /> Thêm Quy Tắc
          </button>
        ) : (
          <button onClick={() => { setPromoForm(EMPTY_PROMO); setPromoModal(true); }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600 text-white text-sm font-bold rounded-xl shadow-sm shadow-violet-500/20 hover:shadow-md hover:-translate-y-0.5 transition-all w-full md:w-auto">
            <Plus size={18} /> Tạo Promo Code
          </button>
        )}
      </div>

      {tab === 'rules' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {loading ? (
            <><SkeletonRuleCard /><SkeletonRuleCard /><SkeletonRuleCard /></>
          ) : rules.length === 0 ? (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                <ListFilter size={32} className="text-slate-400 opacity-50" />
              </div>
              <p className="text-lg font-medium text-slate-900 dark:text-white">Chưa có quy tắc giá nào</p>
              <p className="text-sm mt-1">Tạo quy tắc để tự động điều chỉnh giá theo các điều kiện cụ thể.</p>
            </div>
          ) : rules.map((r) => {
            const info = RULE_TYPE_INFO[r.type] || RULE_TYPE_INFO.PROMO;
            const isDiscount = r.modifierValue < 0;
            return (
              <div key={r.id} className="group bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${info.bgColor} ${info.color}`}>
                    <info.icon size={14} /> {info.label}
                  </div>
                  <button onClick={() => handleDeleteRule(r.id)}
                    className="p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 dark:bg-slate-800 dark:hover:bg-red-500/10 dark:text-slate-500 dark:hover:text-red-400 rounded-xl transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
                <h3 className="text-lg text-slate-900 dark:text-white font-bold mb-5 truncate" title={r.name}>{r.name}</h3>
                
                <div className="space-y-3 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Thay đổi giá</span>
                    <span className={`font-bold px-2 py-0.5 rounded-md ${isDiscount ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                      {!isDiscount ? '+' : ''}{r.modifierValue}{r.modifierType === 'PERCENTAGE' ? '%' : 'đ'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Độ ưu tiên</span>
                    <span className="text-slate-700 dark:text-slate-300 font-bold bg-white dark:bg-slate-700 w-6 h-6 flex items-center justify-center rounded-full shadow-sm">{r.priority}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Trạng thái</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${r.isActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                      <span className={`font-bold ${r.isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                        {r.isActive ? 'Đang bật' : 'Đã tắt'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-white/5">
                  <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider">Mã Code</th>
                  <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider">Mô Tả Chương Trình</th>
                  <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider">Mức Giảm</th>
                  <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider">Lượt Dùng</th>
                  <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider">Thời Gian Hiệu Lực</th>
                  <th className="px-5 py-4 font-semibold uppercase text-xs tracking-wider text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <><SkeletonPromoRow /><SkeletonPromoRow /></>
                ) : promos.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="py-20 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                          <Scissors size={32} className="text-slate-400 opacity-50" />
                        </div>
                        <p className="text-lg font-medium text-slate-900 dark:text-white">Chưa có mã khuyến mãi nào</p>
                      </div>
                    </td>
                  </tr>
                ) : promos.map((p) => {
                  const usagePercent = Math.min(100, Math.round(((p.currentUses || 0) / p.maxUses) * 100));
                  return (
                    <tr key={p.id} className="group border-b border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 text-violet-700 dark:text-violet-400 rounded-lg font-mono text-sm font-bold">
                          <Tag size={14} /> {p.code}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-700 dark:text-slate-300 font-medium max-w-[250px] truncate" title={p.description}>
                        {p.description || '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 font-bold rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                          -{p.discountPercent}%
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                            <span>{p.currentUses || 0}</span>
                            <span>{p.maxUses}</span>
                          </div>
                          <div className="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${usagePercent > 90 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${usagePercent}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> {p.validFrom?.split('T')[0] || '—'}</span>
                          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> {p.validUntil?.split('T')[0] || '—'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button onClick={() => handleDeletePromo(p.id)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Xóa mã">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Rule Modal */}
      {ruleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 dark:border-white/5 shrink-0">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ListFilter className="text-blue-500" size={24} /> Thêm Quy Tắc Giá
              </h3>
              <button onClick={() => setRuleModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              <div>
                <label className={labelCls}>Tên Quy Tắc <span className="text-red-500">*</span></label>
                <input value={ruleForm.name} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  placeholder="VD: Phụ thu cao điểm hè" className={inputCls} />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Loại Điều Kiện</label>
                  <div className="relative">
                    <select value={ruleForm.type} onChange={(e) => setRuleForm({ ...ruleForm, type: e.target.value })}
                      className={inputCls + " appearance-none cursor-pointer pr-10"}>
                      {Object.entries(RULE_TYPE_INFO).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Hình Thức Thay Đổi</label>
                  <div className="relative flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button 
                      onClick={() => setRuleForm({ ...ruleForm, modifierType: 'PERCENTAGE' })}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-bold rounded-lg transition-all ${ruleForm.modifierType === 'PERCENTAGE' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                      <Percent size={14} /> %
                    </button>
                    <button 
                      onClick={() => setRuleForm({ ...ruleForm, modifierType: 'FIXED' })}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-bold rounded-lg transition-all ${ruleForm.modifierType === 'FIXED' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                      <DollarSign size={14} /> VNĐ
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>
                    Giá Trị ({ruleForm.modifierType === 'PERCENTAGE' ? '%' : 'VNĐ'})
                    <span className="text-[10px] font-normal text-slate-400 ml-2 normal-case tracking-normal">Âm để giảm, dương để tăng</span>
                  </label>
                  <input type="number" value={ruleForm.modifierValue}
                    onChange={(e) => setRuleForm({ ...ruleForm, modifierValue: +e.target.value })}
                    placeholder="VD: -15 (giảm) hoặc 10 (tăng)" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Độ Ưu Tiên (Priority)</label>
                  <input type="number" min={1} value={ruleForm.priority}
                    onChange={(e) => setRuleForm({ ...ruleForm, priority: +e.target.value })} className={inputCls} />
                </div>
              </div>
              
              <div>
                <label className={labelCls}>
                  Cấu Hình Nâng Cao (JSON)
                  <span className="text-[10px] font-normal text-slate-400 ml-2 normal-case tracking-normal">Tùy chọn</span>
                </label>
                <textarea value={ruleForm.conditions}
                  onChange={(e) => setRuleForm({ ...ruleForm, conditions: e.target.value })}
                  placeholder='{"minGroup": 5, "maxGroup": 10}' rows={3} 
                  className={inputCls + ' font-mono text-xs resize-none bg-slate-900 text-emerald-400 placeholder-slate-600 focus:ring-slate-500'} />
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <input type="checkbox" id="ruleActive" checked={ruleForm.isActive}
                  onChange={(e) => setRuleForm({ ...ruleForm, isActive: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                <label htmlFor="ruleActive" className="text-sm font-bold text-slate-900 dark:text-white cursor-pointer select-none">
                  Kích hoạt quy tắc ngay
                </label>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 px-8 py-5 border-t border-slate-100 dark:border-white/5 shrink-0 bg-slate-50 dark:bg-slate-800/30 rounded-b-3xl">
              <button onClick={() => setRuleModal(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">Hủy</button>
              <button onClick={handleCreateRule} disabled={saving}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-sm transition-all">
                {saving ? 'Đang lưu...' : 'Lưu Quy Tắc'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Promo Modal */}
      {promoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Scissors className="text-violet-500" size={24} /> Tạo Mã Khuyến Mãi
              </h3>
              <button onClick={() => setPromoModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors"><X size={20} /></button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Mã Code <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-500" size={16} />
                    <input value={promoForm.code} onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                      placeholder="SUMMER25" className={inputCls + ' font-mono uppercase pl-10 text-violet-700 dark:text-violet-400 font-bold'} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Mức Giảm (%)</label>
                  <div className="relative">
                    <input type="number" min={1} max={100} value={promoForm.discountPercent}
                      onChange={(e) => setPromoForm({ ...promoForm, discountPercent: +e.target.value })} 
                      className={inputCls + ' pr-10 text-emerald-600 dark:text-emerald-400 font-bold'} />
                    <Percent className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  </div>
                </div>
              </div>
              
              <div>
                <label className={labelCls}>Mô tả chương trình</label>
                <input value={promoForm.description} onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                  placeholder="VD: Giảm giá đặc biệt nhân dịp Quốc Khánh..." className={inputCls} />
              </div>
              
              <div>
                <label className={labelCls}>Giới hạn lượt dùng</label>
                <input type="number" min={1} value={promoForm.maxUses}
                  onChange={(e) => setPromoForm({ ...promoForm, maxUses: +e.target.value })} className={inputCls} />
              </div>
              
              <div className="grid grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/30 p-5 rounded-2xl border border-slate-100 dark:border-white/5">
                <div>
                  <label className={labelCls}>Ngày bắt đầu</label>
                  <input type="date" value={promoForm.validFrom}
                    onChange={(e) => setPromoForm({ ...promoForm, validFrom: e.target.value })}
                    className={inputCls + ' !py-2'} />
                </div>
                <div>
                  <label className={labelCls}>Ngày kết thúc</label>
                  <input type="date" value={promoForm.validUntil}
                    onChange={(e) => setPromoForm({ ...promoForm, validUntil: e.target.value })}
                    className={inputCls + ' !py-2'} />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 px-8 py-5 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/30 rounded-b-3xl">
              <button onClick={() => setPromoModal(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">Hủy</button>
              <button onClick={handleCreatePromo} disabled={saving}
                className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-sm transition-all">
                {saving ? 'Đang tạo...' : 'Lưu Mã KM'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
