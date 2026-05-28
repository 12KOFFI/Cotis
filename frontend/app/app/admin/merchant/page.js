"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Ban,
  Activity,
  Shield,
  Zap,
  Eye,
  X,
  Hash,
  CreditCard,
  Info,
} from "lucide-react";
import AppShell from "../../../components/AppShell";
import { api, fcfa } from "../../../lib/api";
import { fmtDate, fmtTime } from "../../../lib/utils";



const WALLET_STATUS_CFG = {
  active:   { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", label: "Actif", Icon: CheckCircle2 },
  inactive: { color: "text-slate-400",   bg: "bg-slate-50",   border: "border-slate-100",   label: "Inactif", Icon: Ban },
  pending:  { color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100",   label: "En attente", Icon: Clock },
};

const PAYOUT_STATUS_CFG = {
  paid:      { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", label: "Payé" },
  completed: { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", label: "Complété" },
  pending:   { color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100",   label: "En attente" },
  failed:    { color: "text-rose-600",    bg: "bg-rose-50",    border: "border-rose-100",    label: "Échoué" },
};

/* ================================================================ */
/*  Page Principale                                                   */
/* ================================================================ */

export default function MerchantDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [payouts, setPayouts] = useState({ data: [], meta: {} });
  const [loading, setLoading] = useState(true);
  const [payoutsLoading, setPayoutsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [txDetail, setTxDetail] = useState(null);
  const [txDetailLoading, setTxDetailLoading] = useState(false);

  const loadDashboard = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [dashRes, payoutsRes] = await Promise.all([
        api.get("/admin/merchant/dashboard"),
        api.get("/admin/merchant/payouts?limit=10"),
      ]);

      if (dashRes.data.error) {
        setError(dashRes.data.message);
      } else {
        setData(dashRes.data);
        setError(null);
      }

      setPayouts(payoutsRes.data);
    } catch (e) {
      if (e.response?.status === 403) {
        router.push("/app");
        return;
      }
      setError(e.response?.data?.message || "Connexion à GeniusPay impossible.");
    } finally {
      setLoading(false);
      setPayoutsLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  // Charger les détails d'une transaction via sa référence
  const loadTxDetails = async (reference) => {
    if (!reference) return;
    setTxDetailLoading(true);
    try {
      const res = await api.get(`/admin/merchant/transactions/${reference}`);
      setTxDetail(res.data.data);
    } catch {
      setTxDetail(null);
    } finally {
      setTxDetailLoading(false);
    }
  };

  return (
    <AppShell title="Gateway Marchand" role="super_admin" back>
      {/* Barre de rafraîchissement */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <Shield className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-wave-400">GeniusPay</p>
            <p className="text-[10px] text-wave-400">Environnement {process.env.NODE_ENV === "production" ? "Production" : "Sandbox"}</p>
          </div>
        </div>
        <button
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-xl bg-wave-50 px-3 py-2 text-xs font-bold text-wave-600 border border-wave-100 transition hover:bg-wave-100 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Mise à jour…" : "Actualiser"}
        </button>
      </div>

      {/* État d'erreur */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 rounded-2xl bg-rose-50 border border-rose-200 p-4 flex items-start gap-3"
        >
          <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-rose-700">Service temporairement indisponible</p>
            <p className="text-xs text-rose-600 mt-0.5">{error}</p>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="h-40 animate-pulse rounded-3xl bg-wave-100/60" />
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-3xl bg-wave-100/60" />
            ))}
          </div>
          <div className="h-60 animate-pulse rounded-3xl bg-wave-100/60" />
        </div>
      ) : data ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          {/* ──── CARTE SOLDE PRINCIPAL ──── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-6 text-white shadow-xl"
          >
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-500/15 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full bg-emerald-500/10 blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-brand-300" />
                <p className="text-xs font-medium text-slate-400">Solde disponible</p>
              </div>
              <p className="font-display text-[2.5rem] font-extrabold tracking-tight leading-none">
                {formatFcfa(data.balance?.available || 0)}
                <span className="ml-1 text-lg text-slate-500">F</span>
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <MiniStat label="En attente" value={formatFcfa(data.balance?.pending || 0)} icon={Clock} tone="amber" />
                <MiniStat label="Total collecté" value={formatFcfa(data.balance?.total || 0)} icon={TrendingUp} tone="emerald" />
              </div>
            </div>
          </motion.div>

          {/* ──── WALLETS ──── */}
          {data.wallets && data.wallets.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 px-1">
                <p className="text-xs font-black uppercase tracking-wider text-wave-400">Wallets</p>
                <div className="flex-1 h-px bg-wave-100" />
              </div>

              <div className="space-y-2.5">
                {data.wallets.map((wallet) => {
                  const cfg = WALLET_STATUS_CFG[wallet.status] || WALLET_STATUS_CFG.inactive;
                  const usagePercent = wallet.daily_limit > 0
                    ? Math.round((wallet.daily_spent / wallet.daily_limit) * 100)
                    : 0;

                  return (
                    <motion.div
                      key={wallet.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl bg-white p-4 shadow-sm border border-wave-100"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
                            <Wallet className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="text-sm font-bold text-wave-900">{wallet.name}</p>
                            <p className="text-[10px] text-wave-400 uppercase font-bold tracking-wider">{wallet.type} · {wallet.currency}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
                          <cfg.Icon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2.5">
                        <div className="rounded-xl bg-wave-50 p-3 border border-wave-100">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-wave-400">Balance</p>
                          <p className="text-base font-extrabold text-wave-900 mt-0.5">{formatFcfa(wallet.available_balance)}</p>
                        </div>
                        <div className="rounded-xl bg-wave-50 p-3 border border-wave-100">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-wave-400">En attente</p>
                          <p className="text-base font-extrabold text-amber-600 mt-0.5">{formatFcfa(wallet.pending_balance)}</p>
                        </div>
                        <div className="rounded-xl bg-wave-50 p-3 border border-wave-100">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-wave-400">Restant jour</p>
                          <p className="text-base font-extrabold text-emerald-600 mt-0.5">{formatFcfa(wallet.daily_remaining)}</p>
                        </div>
                      </div>

                      {/* Jauge d'utilisation quotidienne */}
                      {wallet.daily_limit > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between text-[10px] font-bold text-wave-400 mb-1">
                            <span>Utilisation quotidienne</span>
                            <span>{usagePercent}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-wave-100 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${usagePercent}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className={`h-full rounded-full ${usagePercent > 80 ? "bg-rose-500" : usagePercent > 50 ? "bg-amber-500" : "bg-brand-500"}`}
                            />
                          </div>
                          <p className="text-[10px] text-wave-400 mt-1">
                            {formatFcfa(wallet.daily_spent)} / {formatFcfa(wallet.daily_limit)} {wallet.currency}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ──── PAYOUTS RÉCENTS ──── */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-xs font-black uppercase tracking-wider text-wave-400">Derniers Payouts</p>
              {payouts.meta?.total > 0 && (
                <span className="text-[10px] font-medium text-wave-400 bg-wave-50 px-2 py-0.5 rounded-md">
                  {payouts.meta.total} total
                </span>
              )}
            </div>

            {payoutsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-2xl bg-wave-100/60" />
                ))}
              </div>
            ) : payouts.data?.length > 0 ? (
              <div className="space-y-2">
                {payouts.data.map((payout, idx) => {
                  const cfg = PAYOUT_STATUS_CFG[payout.status] || PAYOUT_STATUS_CFG.pending;
                  return (
                    <motion.button
                      key={payout.id || idx}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      onClick={() => setSelectedPayout(payout)}
                      className="w-full text-left flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-wave-100 active:scale-[0.98] transition-transform"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
                          <ArrowDownLeft className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-wave-900">
                            {payout.destination_account || payout.recipient_phone || "—"}
                          </p>
                          <p className="text-[11px] font-medium text-wave-400 mt-0.5">
                            {fmtDate(payout.created_at)} · {fmtTime(payout.created_at)} · {payout.destination_provider || "wave"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <p className={`text-base font-extrabold ${cfg.color}`}>
                          {formatFcfa(payout.amount)}
                        </p>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
                          {cfg.label}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl bg-wave-50 py-10 text-center border-2 border-dashed border-wave-200">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-white text-wave-400 shadow-sm">
                  <Activity className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-wave-500">Aucun payout enregistré.</p>
              </div>
            )}
          </div>
        </motion.div>
      ) : null}

      {/* ──── MODAL DÉTAILS PAYOUT ──── */}
      <AnimatePresence>
        {selectedPayout && (
          <div
            className="fixed inset-0 z-50 grid place-items-end bg-wave-900/40 backdrop-blur-sm sm:place-items-center"
            onClick={() => { setSelectedPayout(null); setTxDetail(null); }}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="flex flex-col w-full max-w-md rounded-t-3xl bg-white shadow-soft sm:rounded-3xl max-h-[90vh]"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-wave-100 px-5 py-4">
                <h3 className="font-display text-lg font-extrabold text-wave-950">Détails du Payout</h3>
                <button
                  onClick={() => { setSelectedPayout(null); setTxDetail(null); }}
                  className="grid h-9 w-9 place-items-center rounded-full border border-wave-100 text-wave-500 transition hover:bg-wave-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-y-auto px-5 pb-5">
                <div className="space-y-3 pt-3">
                  {/* Montant */}
                  <div className="rounded-2xl bg-wave-50 p-4 border border-wave-100 flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-100 text-brand-600">
                        <Wallet className="h-6 w-6" />
                      </span>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">Montant</p>
                        <p className="text-xl font-extrabold text-wave-900">{formatFcfa(selectedPayout.amount)} F</p>
                      </div>
                    </div>
                    {(() => {
                      const cfg = PAYOUT_STATUS_CFG[selectedPayout.status] || PAYOUT_STATUS_CFG.pending;
                      return (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
                          {cfg.label}
                        </span>
                      );
                    })()}
                  </div>

                  {/* Frais et net */}
                  {(selectedPayout.fees > 0 || selectedPayout.net_amount > 0) && (
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="rounded-2xl bg-wave-50 p-3.5 border border-wave-100">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">Frais</p>
                        <p className="text-sm font-extrabold text-rose-600 mt-1">{formatFcfa(selectedPayout.fees || 0)} F</p>
                      </div>
                      <div className="rounded-2xl bg-wave-50 p-3.5 border border-wave-100">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">Net reçu</p>
                        <p className="text-sm font-extrabold text-emerald-600 mt-1">{formatFcfa(selectedPayout.net_amount || 0)} F</p>
                      </div>
                    </div>
                  )}

                  {/* Référence */}
                  {selectedPayout.reference && (
                    <div className="rounded-2xl bg-wave-50 p-3.5 border border-wave-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">Référence</p>
                        <p className="text-sm font-extrabold text-wave-800 mt-1 font-mono">{selectedPayout.reference}</p>
                      </div>
                      <Hash className="h-5 w-5 text-wave-400" />
                    </div>
                  )}

                  {/* Destination */}
                  <div className="rounded-2xl bg-wave-50 p-3.5 border border-wave-100">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">Destination</p>
                    <div className="mt-1.5 space-y-1">
                      <p className="text-sm font-bold text-wave-800">{selectedPayout.destination_account || selectedPayout.recipient_phone || "—"}</p>
                      <p className="text-[11px] text-wave-500 capitalize">{selectedPayout.destination_provider || "wave"} · {selectedPayout.destination_type || "mobile_money"}</p>
                    </div>
                  </div>

                  {/* Date et heure */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-2xl bg-wave-50 p-3.5 border border-wave-100">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">Date</p>
                      <p className="text-sm font-bold text-wave-800 mt-1">{fmtDate(selectedPayout.created_at)}</p>
                    </div>
                    <div className="rounded-2xl bg-wave-50 p-3.5 border border-wave-100">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">Heure</p>
                      <p className="text-sm font-bold text-wave-800 mt-1">{fmtTime(selectedPayout.created_at) || "—"}</p>
                    </div>
                  </div>

                  {/* Raison d'échec */}
                  {selectedPayout.failure_reason && (
                    <div className="rounded-2xl bg-rose-50 p-3.5 border border-rose-200">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-rose-500" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500">Raison de l'échec</p>
                      </div>
                      <p className="text-sm font-semibold text-rose-700 mt-1">{selectedPayout.failure_reason}</p>
                    </div>
                  )}

                  {/* Bouton référence transaction */}
                  {selectedPayout.reference && !txDetail && (
                    <button
                      onClick={() => loadTxDetails(selectedPayout.reference)}
                      disabled={txDetailLoading}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-brand-50 py-3 text-sm font-bold text-brand-700 border border-brand-100 w-full disabled:opacity-50 transition active:scale-95"
                    >
                      <Eye className="h-4 w-4" />
                      {txDetailLoading ? "Chargement..." : "Voir les détails API"}
                    </button>
                  )}

                  {/* Détails de la transaction API */}
                  {txDetail && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="rounded-2xl bg-brand-50 p-4 border border-brand-100"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="h-4 w-4 text-brand-600" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-600">Réponse API GeniusPay</p>
                      </div>
                      <pre className="text-[10px] text-brand-800 bg-white rounded-xl p-3 overflow-x-auto border border-brand-100 max-h-40">
                        {JSON.stringify(txDetail, null, 2)}
                      </pre>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}

/* ================================================================ */
/*  Composants internes                                               */
/* ================================================================ */

function MiniStat({ label, value, icon: Icon, tone }) {
  const tones = {
    amber:   "bg-amber-500/10 text-amber-400",
    emerald: "bg-emerald-500/10 text-emerald-400",
    brand:   "bg-brand-500/10 text-brand-300",
  };
  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-sm p-3.5 border border-white/10">
      <div className="flex items-center gap-2 mb-1">
        <span className={`grid h-6 w-6 place-items-center rounded-lg ${tones[tone] || tones.brand}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      </div>
      <p className="text-lg font-extrabold text-white">{value}</p>
    </div>
  );
}

/**
 * Formattage FCFA compact (sans le suffixe " FCFA").
 */
function formatFcfa(n) {
  return new Intl.NumberFormat("fr-FR").format(Number(n || 0));
}
