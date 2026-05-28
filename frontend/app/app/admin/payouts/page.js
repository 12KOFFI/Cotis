"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, X, CheckCircle2, Clock, AlertTriangle, Ban,
  ArrowDownLeft, Hash, Wallet, ChevronLeft, ChevronRight, RefreshCw,
} from "lucide-react";
import AppShell from "../../../components/AppShell";
import { api, fcfa } from "../../../lib/api";
import { fmtDate, fmtTime } from "../../../lib/utils";

const STATUS_CFG = {
  paid:      { label: "Payé",       color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", Icon: CheckCircle2 },
  completed: { label: "Complété",   color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", Icon: CheckCircle2 },
  pending:   { label: "En attente", color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100",   Icon: Clock },
  failed:    { label: "Échoué",     color: "text-rose-600",    bg: "bg-rose-50",    border: "border-rose-100",    Icon: AlertTriangle },
  cancelled: { label: "Annulé",     color: "text-slate-500",   bg: "bg-slate-50",   border: "border-slate-100",   Icon: Ban },
};

export default function PayoutsMonitoring() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  // Filtres
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ per_page: "15", page: String(p) });
      if (status) params.set("status", status);
      if (search) params.set("search", search);
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const r = await api.get(`/admin/payouts?${params}`);
      setData(r.data.data || []);
      setMeta(r.data.meta || {});
      setStats(r.data.stats || {});
      setPage(p);
    } catch (e) {
      if (e.response?.status === 403) router.push("/app");
    } finally {
      setLoading(false);
    }
  }, [status, search, from, to, router]);

  useEffect(() => { load(1); }, [status, from, to]);

  const handleSearch = (e) => { e.preventDefault(); load(1); };

  return (
    <AppShell title="Monitoring Payouts" role="super_admin" back>
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        <StatCard label="Total payouts" value={stats.total_count || 0} />
        <StatCard label="Volume payé" value={fcfa(stats.total_paid || 0)} tone="emerald" />
        <StatCard label="Échoués" value={stats.total_failed || 0} tone="rose" />
        <StatCard label="En attente" value={stats.total_pending || 0} tone="amber" />
      </div>

      {/* Filtres */}
      <div className="mb-4 space-y-2.5">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-wave-400" />
            <input className="input pl-10 w-full" placeholder="Téléphone, nom, référence…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary px-4 !py-2.5">Rechercher</button>
        </form>
        <div className="flex flex-wrap gap-2">
          <select className="input !py-2 text-xs !w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Tous les statuts</option>
            <option value="paid">Payé</option>
            <option value="pending">En attente</option>
            <option value="failed">Échoué</option>
            <option value="cancelled">Annulé</option>
          </select>
          <input type="date" className="input !py-2 text-xs !w-auto" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="date" className="input !py-2 text-xs !w-auto" value={to} onChange={(e) => setTo(e.target.value)} />
          {(status || from || to || search) && (
            <button onClick={() => { setStatus(""); setSearch(""); setFrom(""); setTo(""); }} className="text-xs font-bold text-wave-500 hover:text-wave-700 flex items-center gap-1">
              <X className="h-3 w-3" /> Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-16 animate-pulse rounded-2xl bg-wave-100/60" />)}</div>
      ) : data.length === 0 ? (
        <div className="rounded-3xl bg-wave-50 py-12 text-center border-2 border-dashed border-wave-200">
          <p className="text-sm font-medium text-wave-500">Aucun payout trouvé.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((p, i) => {
            const cfg = STATUS_CFG[p.status] || STATUS_CFG.pending;
            return (
              <motion.button key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                onClick={() => setSelected(p)}
                className="w-full text-left flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-wave-100 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
                    <ArrowDownLeft className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-wave-900">{p.recipient_name || p.recipient_phone}</p>
                    <p className="text-[11px] text-wave-400">{p.groupe?.nom || "—"} · {fmtDate(p.created_at)} {fmtTime(p.created_at)}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                  <p className="text-sm font-extrabold text-wave-900">{fcfa(p.amount)}</p>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
                    <cfg.Icon className="h-2.5 w-2.5" />{cfg.label}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta.last_page > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-[11px] text-wave-400">{meta.total} résultats · Page {meta.current_page}/{meta.last_page}</p>
          <div className="flex gap-1.5">
            <button disabled={page <= 1} onClick={() => load(page - 1)} className="grid h-8 w-8 place-items-center rounded-lg bg-wave-50 border border-wave-100 disabled:opacity-30"><ChevronLeft className="h-4 w-4" /></button>
            <button disabled={page >= meta.last_page} onClick={() => load(page + 1)} className="grid h-8 w-8 place-items-center rounded-lg bg-wave-50 border border-wave-100 disabled:opacity-30"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {/* Modal détails (Read-only) */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 grid place-items-end bg-wave-900/40 backdrop-blur-sm sm:place-items-center" onClick={() => setSelected(null)}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="flex flex-col w-full max-w-md rounded-t-3xl bg-white shadow-soft sm:rounded-3xl max-h-[90vh]"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-wave-100 px-5 py-4">
                <h3 className="font-display text-lg font-extrabold">Détails Payout</h3>
                <button onClick={() => setSelected(null)} className="grid h-9 w-9 place-items-center rounded-full border border-wave-100 text-wave-500 hover:bg-wave-50"><X className="h-4 w-4" /></button>
              </div>
              <div className="overflow-y-auto px-5 pb-5 space-y-3 pt-3">
                {/* Montant + statut */}
                <div className="rounded-2xl bg-wave-50 p-4 border border-wave-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-100 text-brand-600"><Wallet className="h-6 w-6" /></span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">Montant brut</p>
                      <p className="text-xl font-extrabold text-wave-900">{fcfa(selected.amount)}</p>
                    </div>
                  </div>
                  {(() => { const c = STATUS_CFG[selected.status] || STATUS_CFG.pending; return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${c.bg} ${c.color} ${c.border} border`}><c.Icon className="h-3 w-3" />{c.label}</span>; })()}
                </div>

                {/* Grille frais */}
                <div className="grid grid-cols-3 gap-2">
                  <DetailCell label="Frais GeniusPay" value={fcfa(selected.gateway_fees || 0)} tone="rose" />
                  <DetailCell label="Commission" value={fcfa(selected.platform_commission || 0)} tone="rose" />
                  <DetailCell label="Net reçu" value={fcfa(selected.net_amount || 0)} tone="emerald" />
                </div>

                {/* Infos */}
                <DetailRow label="Destinataire" value={`${selected.recipient_name || "—"} · ${selected.recipient_phone}`} />
                <DetailRow label="Groupe" value={selected.groupe?.nom || "—"} />
                <DetailRow label="Initié par" value={selected.user?.name || "—"} />
                <DetailRow label="Provider" value={selected.destination_provider || "wave"} />
                {selected.provider_reference && <DetailRow label="Réf. Provider" value={selected.provider_reference} mono />}
                {selected.idempotency_key && <DetailRow label="Clé idempotence" value={selected.idempotency_key} mono />}
                <DetailRow label="Date" value={`${fmtDate(selected.created_at)} à ${fmtTime(selected.created_at)}`} />

                {/* Erreur */}
                {selected.failure_reason && (
                  <div className="rounded-2xl bg-rose-50 p-3.5 border border-rose-200">
                    <div className="flex items-center gap-2 mb-1"><AlertTriangle className="h-4 w-4 text-rose-500" /><p className="text-[10px] font-bold uppercase tracking-widest text-rose-500">Erreur</p></div>
                    <p className="text-sm text-rose-700">{selected.failure_reason}</p>
                    {selected.failure_code && <p className="text-[10px] font-mono text-rose-400 mt-1">Code: {selected.failure_code}</p>}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}

function StatCard({ label, value, tone }) {
  const colors = { emerald: "text-emerald-600", rose: "text-rose-600", amber: "text-amber-600" };
  return (
    <div className="rounded-2xl bg-white p-3.5 border border-wave-100 shadow-sm">
      <p className="text-[9px] font-bold uppercase tracking-widest text-wave-400">{label}</p>
      <p className={`text-lg font-extrabold mt-0.5 ${colors[tone] || "text-wave-900"}`}>{value}</p>
    </div>
  );
}

function DetailCell({ label, value, tone }) {
  const c = { rose: "text-rose-600", emerald: "text-emerald-600" };
  return (
    <div className="rounded-xl bg-wave-50 p-3 border border-wave-100">
      <p className="text-[9px] font-bold uppercase tracking-widest text-wave-400">{label}</p>
      <p className={`text-sm font-extrabold mt-0.5 ${c[tone] || "text-wave-900"}`}>{value}</p>
    </div>
  );
}

function DetailRow({ label, value, mono }) {
  return (
    <div className="rounded-2xl bg-wave-50 p-3.5 border border-wave-100 flex items-center justify-between">
      <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">{label}</p>
      <p className={`text-sm font-bold text-wave-800 ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
    </div>
  );
}
