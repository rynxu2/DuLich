'use client';

import { useEffect, useState } from 'react';
import { pricingApi } from '@/lib/api';
import { Plus, Trash2, Tag, Calendar, Users as UsersIcon, Baby, Zap, Clock, X } from 'lucide-react';

const RULE_TYPE_INFO: Record<string, { label: string; icon: any; color: string }> = {
  SEASONAL: { label: 'Mùa vụ', icon: Calendar, color: 'text-amber-400 bg-amber-500/10' },
  GROUP: { label: 'Nhóm', icon: UsersIcon, color: 'text-blue-400 bg-blue-500/10' },
  AGE: { label: 'Độ tuổi', icon: Baby, color: 'text-pink-400 bg-pink-500/10' },
  EARLYBIRD: { label: 'Early Bird', icon: Clock, color: 'text-emerald-400 bg-emerald-500/10' },
  LASTMINUTE: { label: 'Last Minute', icon: Zap, color: 'text-red-400 bg-red-500/10' },
  PROMO: { label: 'Promo', icon: Tag, color: 'text-violet-400 bg-violet-500/10' },
};

const EMPTY_RULE = { name: '', type: 'SEASONAL', modifierType: 'PERCENTAGE', modifierValue: 0, priority: 1, isActive: true, conditions: '' };
const EMPTY_PROMO = { code: '', description: '', discountPercent: 10, maxUses: 100, validFrom: '', validUntil: '' };

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

  const inputCls = 'w-full px-4 py-2.5 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition text-sm';
  const labelCls = 'block text-xs font-medium text-slate-400 mb-1.5';

  return (
    <div className="space-y-5">
      {/* Tabs + Add buttons */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          <button onClick={() => setTab('rules')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === 'rules' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            Pricing Rules ({rules.length})
          </button>
          <button onClick={() => setTab('promos')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === 'promos' ? 'bg-violet-500/20 text-violet-400' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
            Promo Codes ({promos.length})
          </button>
        </div>
        {tab === 'rules' ? (
          <button onClick={() => { setRuleForm(EMPTY_RULE); setRuleModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white text-sm font-medium transition">
            <Plus size={16} /> Thêm Rule
          </button>
        ) : (
          <button onClick={() => { setPromoForm(EMPTY_PROMO); setPromoModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-white text-sm font-medium transition">
            <Plus size={16} /> Thêm Promo
          </button>
        )}
      </div>

      {tab === 'rules' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full py-12 text-center text-slate-500">Đang tải...</div>
          ) : rules.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500">Chưa có pricing rule</div>
          ) : rules.map((r) => {
            const info = RULE_TYPE_INFO[r.type] || RULE_TYPE_INFO.PROMO;
            return (
              <div key={r.id} className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition">
                <div className="flex items-center justify-between mb-3">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${info.color}`}>
                    <info.icon size={12} /> {info.label}
                  </div>
                  <button onClick={() => handleDeleteRule(r.id)}
                    className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-400 transition"><Trash2 size={14} /></button>
                </div>
                <h3 className="text-white font-semibold mb-2">{r.name}</h3>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>Modifier</span>
                    <span className={r.modifierValue > 0 ? 'text-red-400' : 'text-emerald-400'}>
                      {r.modifierValue > 0 ? '+' : ''}{r.modifierValue}{r.modifierType === 'PERCENTAGE' ? '%' : 'đ'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Priority</span>
                    <span className="text-slate-300">{r.priority}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Trạng thái</span>
                    <span className={r.isActive ? 'text-emerald-400' : 'text-red-400'}>
                      {r.isActive ? 'Hoạt động' : 'Tắt'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 bg-slate-900/50">
                <th className="px-5 py-3.5 font-medium">Mã Code</th>
                <th className="px-5 py-3.5 font-medium">Mô Tả</th>
                <th className="px-5 py-3.5 font-medium">Giảm</th>
                <th className="px-5 py-3.5 font-medium">Sử Dụng</th>
                <th className="px-5 py-3.5 font-medium">Hiệu Lực</th>
                <th className="px-5 py-3.5 font-medium text-center">Xóa</th>
              </tr>
            </thead>
            <tbody>
              {promos.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-slate-500">Chưa có promo code</td></tr>
              ) : promos.map((p) => (
                <tr key={p.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                  <td className="px-5 py-4">
                    <span className="px-3 py-1 bg-violet-500/10 text-violet-400 rounded-lg font-mono text-sm font-bold">{p.code}</span>
                  </td>
                  <td className="px-5 py-4 text-slate-400">{p.description || '—'}</td>
                  <td className="px-5 py-4">
                    <span className="text-emerald-400 font-medium">-{p.discountPercent}%</span>
                  </td>
                  <td className="px-5 py-4 text-slate-400">{p.currentUses || 0}/{p.maxUses}</td>
                  <td className="px-5 py-4 text-slate-400 text-xs">{p.validFrom?.split('T')[0]} → {p.validUntil?.split('T')[0]}</td>
                  <td className="px-5 py-4 text-center">
                    <button onClick={() => handleDeletePromo(p.id)}
                      className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-400 transition"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Rule Modal */}
      {ruleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white">Thêm Pricing Rule</h3>
              <button onClick={() => setRuleModal(false)} className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={labelCls}>Tên Rule *</label>
                <input value={ruleForm.name} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  placeholder="VD: Giảm giá mùa hè" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Loại Rule</label>
                  <select value={ruleForm.type} onChange={(e) => setRuleForm({ ...ruleForm, type: e.target.value })}
                    className={inputCls}>
                    {Object.entries(RULE_TYPE_INFO).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Loại Modifier</label>
                  <select value={ruleForm.modifierType} onChange={(e) => setRuleForm({ ...ruleForm, modifierType: e.target.value })}
                    className={inputCls}>
                    <option value="PERCENTAGE">Phần trăm (%)</option>
                    <option value="FIXED">Cố định (VNĐ)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Giá trị Modifier</label>
                  <input type="number" value={ruleForm.modifierValue}
                    onChange={(e) => setRuleForm({ ...ruleForm, modifierValue: +e.target.value })}
                    placeholder="VD: -15 (giảm 15%)" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Priority</label>
                  <input type="number" min={1} value={ruleForm.priority}
                    onChange={(e) => setRuleForm({ ...ruleForm, priority: +e.target.value })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Conditions (JSON, tùy chọn)</label>
                <textarea value={ruleForm.conditions}
                  onChange={(e) => setRuleForm({ ...ruleForm, conditions: e.target.value })}
                  placeholder='{"minGroup": 5}' rows={2} className={inputCls + ' font-mono resize-none'} />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" checked={ruleForm.isActive}
                  onChange={(e) => setRuleForm({ ...ruleForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded bg-slate-800 border-white/10" />
                Kích hoạt ngay
              </label>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/5">
              <button onClick={() => setRuleModal(false)} className="px-4 py-2.5 text-sm text-slate-400 hover:bg-white/5 rounded-xl transition">Hủy</button>
              <button onClick={handleCreateRule} disabled={saving}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition">
                {saving ? 'Đang lưu...' : 'Tạo Rule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Promo Modal */}
      {promoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white">Thêm Promo Code</h3>
              <button onClick={() => setPromoModal(false)} className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Mã Code *</label>
                  <input value={promoForm.code} onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                    placeholder="VD: SUMMER25" className={inputCls + ' font-mono uppercase'} />
                </div>
                <div>
                  <label className={labelCls}>Giảm giá (%)</label>
                  <input type="number" min={1} max={100} value={promoForm.discountPercent}
                    onChange={(e) => setPromoForm({ ...promoForm, discountPercent: +e.target.value })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Mô tả</label>
                <input value={promoForm.description} onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                  placeholder="Giảm giá nhân dịp..." className={inputCls} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Max lượt dùng</label>
                  <input type="number" min={1} value={promoForm.maxUses}
                    onChange={(e) => setPromoForm({ ...promoForm, maxUses: +e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Ngày bắt đầu</label>
                  <input type="date" value={promoForm.validFrom}
                    onChange={(e) => setPromoForm({ ...promoForm, validFrom: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Ngày kết thúc</label>
                  <input type="date" value={promoForm.validUntil}
                    onChange={(e) => setPromoForm({ ...promoForm, validUntil: e.target.value })}
                    className={inputCls} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/5">
              <button onClick={() => setPromoModal(false)} className="px-4 py-2.5 text-sm text-slate-400 hover:bg-white/5 rounded-xl transition">Hủy</button>
              <button onClick={handleCreatePromo} disabled={saving}
                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition">
                {saving ? 'Đang lưu...' : 'Tạo Promo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
