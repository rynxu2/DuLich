'use client';

import { useEffect, useState } from 'react';
import { pricingApi } from '@/lib/api';
import { Plus, Trash2, Tag, Calendar, Users as UsersIcon, Baby, Zap, Clock } from 'lucide-react';

const RULE_TYPE_INFO: Record<string, { label: string; icon: any; color: string }> = {
  SEASONAL: { label: 'Mùa vụ', icon: Calendar, color: 'text-amber-400 bg-amber-500/10' },
  GROUP: { label: 'Nhóm', icon: UsersIcon, color: 'text-blue-400 bg-blue-500/10' },
  AGE: { label: 'Độ tuổi', icon: Baby, color: 'text-pink-400 bg-pink-500/10' },
  EARLYBIRD: { label: 'Early Bird', icon: Clock, color: 'text-emerald-400 bg-emerald-500/10' },
  LASTMINUTE: { label: 'Last Minute', icon: Zap, color: 'text-red-400 bg-red-500/10' },
  PROMO: { label: 'Promo', icon: Tag, color: 'text-violet-400 bg-violet-500/10' },
};

export default function PricingPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'rules' | 'promos'>('rules');

  useEffect(() => {
    (async () => {
      try {
        const [r, p] = await Promise.allSettled([pricingApi.listRules(), pricingApi.listPromos()]);
        if (r.status === 'fulfilled') setRules(Array.isArray(r.value.data) ? r.value.data : []);
        if (p.status === 'fulfilled') setPromos(Array.isArray(p.value.data) ? p.value.data : []);
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const handleDeleteRule = async (id: number) => {
    if (!confirm('Xóa rule này?')) return;
    try { await pricingApi.deleteRule(id); setRules(rules.filter((r) => r.id !== id)); } catch {}
  };

  const handleDeletePromo = async (id: number) => {
    if (!confirm('Xóa promo code này?')) return;
    try { await pricingApi.deletePromo(id); setPromos(promos.filter((p) => p.id !== id)); } catch {}
  };

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex items-center gap-2">
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
                  {r.conditions && (
                    <div className="mt-2 p-2.5 bg-slate-800/50 rounded-lg">
                      <p className="text-xs text-slate-500 font-mono">
                        {JSON.stringify(r.conditions, null, 0)}
                      </p>
                    </div>
                  )}
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
                <th className="px-5 py-3.5 font-medium">Sử Dụng</th>
                <th className="px-5 py-3.5 font-medium">Hiệu Lực</th>
                <th className="px-5 py-3.5 font-medium text-center">Xóa</th>
              </tr>
            </thead>
            <tbody>
              {promos.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-500">Chưa có promo code</td></tr>
              ) : promos.map((p) => (
                <tr key={p.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                  <td className="px-5 py-4">
                    <span className="px-3 py-1 bg-violet-500/10 text-violet-400 rounded-lg font-mono text-sm font-bold">{p.code}</span>
                  </td>
                  <td className="px-5 py-4 text-slate-400">{p.description || '—'}</td>
                  <td className="px-5 py-4 text-slate-400">{p.currentUses}/{p.maxUses}</td>
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
    </div>
  );
}
