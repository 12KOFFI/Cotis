"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2, Wallet, TrendingUp, ArrowUpRight, ArrowDownLeft,
  Search, RefreshCw, Users, Send,
} from "lucide-react";
import AppShell from "../../../components/AppShell";
import { api, fcfa } from "../../../lib/api";

export default function GroupesSoldes() {
  const router = useRouter();
  const [groupes, setGroupes] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  async function load(refresh = false) {
    if (refresh) setRefreshing(true);
    try {
      const r = await api.get("/admin/groupes-soldes");
      setGroupes(r.data.groupes || []);
      setStats(r.data.stats || {});
    } catch (e) {
      if (e.response?.status === 403) router.push("/app");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = search
    ? groupes.filter(g =>
        g.nom.toLowerCase().includes(search.toLowerCase()) ||
        g.gestionnaire.toLowerCase().includes(search.toLowerCase())
      )
    : groupes;

  return (
    <AppShell title="Soldes Groupes" role="super_admin" back>
      {/* KPIs globaux */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
        <GKpi label="Solde total" value={fcfa(stats.total_solde || 0)} icon={Wallet} />
        <GKpi label="Retirable Wave" value={fcfa(stats.total_disponible || 0)} icon={Send} tone="emerald" />
        <GKpi label="Total entrées" value={fcfa(stats.total_entrees || 0)} icon={ArrowUpRight} tone="brand" />
        <GKpi label="Total sorties" value={fcfa(stats.total_sorties || 0)} icon={ArrowDownLeft} tone="rose" />
      </div>

      {/* Barre */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-wave-400" />
          <input className="input pl-10 w-full" placeholder="Rechercher un groupe…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button onClick={() => load(true)} disabled={refreshing} className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-xl bg-wave-50 border border-wave-100 text-wave-600">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-28 animate-pulse rounded-2xl bg-wave-100/60" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl bg-wave-50 py-12 text-center border-2 border-dashed border-wave-200">
          <p className="text-sm font-medium text-wave-500">{search ? "Aucun groupe trouvé." : "Aucun groupe avec caisse."}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((g, i) => (
            <motion.div key={g.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              className="rounded-2xl bg-white p-4 shadow-sm border border-wave-100"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 text-sm font-bold">
                    {g.nom[0]}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-wave-900">{g.nom}</p>
                    <p className="text-[11px] text-wave-400">{g.gestionnaire} · <Users className="inline h-3 w-3" /> {g.membres_count}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-wave-400 uppercase bg-wave-50 px-2 py-0.5 rounded-md border border-wave-100">{g.type}</span>
              </div>

              {/* Soldes */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-wave-50 p-3 border border-wave-100">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-wave-400">Solde total</p>
                  <p className="text-base font-extrabold text-wave-900 mt-0.5">{fmtCompact(g.solde_total)}</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3 border border-emerald-100">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-500">Retirable Wave</p>
                  <p className="text-base font-extrabold text-emerald-700 mt-0.5">{fmtCompact(g.solde_disponible)}</p>
                </div>
              </div>

              {/* Barres */}
              <div className="mt-2.5 grid grid-cols-3 gap-2">
                <MiniVal label="Entrées" value={g.total_entrees} color="text-emerald-600" />
                <MiniVal label="Sorties" value={g.total_sorties} color="text-rose-600" />
                <MiniVal label="Payouts" value={g.total_payouts} color="text-brand-600" />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <p className="text-center text-[10px] text-wave-400 mt-4">{filtered.length} groupe(s) · Calcul basé sur le ledger en temps réel</p>
    </AppShell>
  );
}

function GKpi({ label, value, icon: Icon, tone }) {
  const colors = { emerald: "bg-emerald-50 text-emerald-600 border-emerald-100", brand: "bg-brand-50 text-brand-600 border-brand-100", rose: "bg-rose-50 text-rose-600 border-rose-100" };
  const c = colors[tone] || "bg-wave-50 text-wave-600 border-wave-100";
  return (
    <div className={`rounded-2xl p-3.5 border shadow-sm ${c}`}>
      <div className="flex items-center gap-1.5 mb-1"><Icon className="h-3.5 w-3.5" /><p className="text-[9px] font-bold uppercase tracking-widest opacity-70">{label}</p></div>
      <p className="text-base font-extrabold">{value}</p>
    </div>
  );
}

function MiniVal({ label, value, color }) {
  return (
    <div className="text-center">
      <p className="text-[9px] font-bold uppercase tracking-widest text-wave-400">{label}</p>
      <p className={`text-xs font-extrabold ${color}`}>{fmtCompact(value)}</p>
    </div>
  );
}

function fmtCompact(n) {
  const v = Number(n || 0);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return new Intl.NumberFormat("fr-FR").format(v);
}
