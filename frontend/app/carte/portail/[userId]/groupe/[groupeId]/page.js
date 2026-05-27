"use client";
import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, ShieldCheck, ArrowLeft, Users, ChevronRight, X, CheckCircle2, Clock, AlertTriangle, Hash, Tag, Calendar } from "lucide-react";
import { api, fcfa } from "../../../../../lib/api";

function Inner() {
  const { userId, groupeId } = useParams();
  const sp = useSearchParams();
  const token = sp.get("token");
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [paiements, setPaiements] = useState(null);
  const [loadingPaiements, setLoadingPaiements] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get(`/public/gestionnaire/${userId}/groupes/${groupeId}/membres`, { params: { token } })
      .then(r => setData(r.data))
      .catch(e => setErr(e.response?.data?.message || "Accès refusé"));
  }, [userId, groupeId, token]);

  function loadPaiements(membre) {
    setSelected(membre);
    setLoadingPaiements(true);
    api.get(`/public/gestionnaire/${userId}/groupes/${groupeId}/membres/${membre.id}/paiements`, { params: { token } })
      .then(r => setPaiements(r.data.paiements))
      .catch(() => setPaiements([]))
      .finally(() => setLoadingPaiements(false));
  }

  const STATUT_STYLES = {
    reussi: { icon: CheckCircle2, cls: "text-brand-600" },
    en_attente: { icon: Clock, cls: "text-amber-600" },
    echoue: { icon: AlertTriangle, cls: "text-red-600" },
    annule: { icon: X, cls: "text-wave-400" },
  };

  return (
    <main className="hero-gradient min-h-screen px-5 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center gap-2">
          <Link href={`/carte/portail/${userId}?token=${token}`} className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-soft ring-1 ring-wave-100 text-wave-600 transition hover:bg-wave-50">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="font-display text-xl font-extrabold">CotisPro</span>
        </div>

        {err && <div className="card text-center"><p className="text-sm text-red-700">{err}</p></div>}

        {data && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="card mb-4">
              <div className="flex items-center gap-2 text-xs text-brand-600"><ShieldCheck className="h-4 w-4" /> Consultation publique sécurisée</div>
              <h2 className="mt-2 font-display text-2xl font-extrabold text-wave-900">{data.groupe.nom}</h2>
              <p className="text-sm text-wave-500">{data.membres.length} membre{data.membres.length > 1 ? "s" : ""}</p>
            </div>

            <h3 className="text-xs font-semibold uppercase tracking-wider text-wave-500 px-1 mb-2">Membres</h3>
            <div className="space-y-2">
              {data.membres.map((m, i) => (
                <motion.button
                  key={m.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => loadPaiements(m)}
                  className="w-full flex items-center justify-between rounded-2xl bg-white p-4 shadow-soft ring-1 ring-wave-100 text-left transition hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full wave-bg text-sm font-bold text-white">
                      {m.prenom?.[0]}{m.nom[0]}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-wave-900 truncate">{m.prenom} {m.nom}</p>
                      <p className="text-[11px] text-wave-500 capitalize">{m.role === "gestionnaire" ? "Gestionnaire" : m.role === "tresorier" ? "Trésorier" : "Membre"}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-wave-300" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Modal paiements */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-end bg-wave-900/40 backdrop-blur-sm sm:place-items-center"
            onClick={() => { setSelected(null); setPaiements(null); }}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="flex flex-col w-full max-w-md rounded-t-3xl bg-white shadow-soft sm:rounded-3xl max-h-[85vh]"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-wave-100 px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full wave-bg text-xs font-bold text-white">{selected.prenom?.[0]}{selected.nom[0]}</span>
                  <div className="min-w-0">
                    <h3 className="font-display text-base font-extrabold truncate">{selected.prenom} {selected.nom}</h3>
                    <p className="text-[11px] text-wave-500 capitalize">{selected.role === "gestionnaire" ? "Gestionnaire" : selected.role === "tresorier" ? "Trésorier" : "Membre"}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setSelected(null); setPaiements(null); }}
                  className="grid h-9 w-9 place-items-center rounded-full border border-wave-100 text-wave-500 transition hover:bg-wave-50 shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-y-auto px-5 py-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-wave-500 mb-3">Historique des paiements</h4>

                {loadingPaiements ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-14 animate-pulse rounded-2xl bg-wave-100/60" />)}
                  </div>
                ) : paiements?.length === 0 ? (
                  <p className="py-8 text-center text-sm text-wave-500">Aucun paiement enregistré.</p>
                ) : (
                  <div className="space-y-2">
                    {paiements?.map(p => {
                      const St = STATUT_STYLES[p.statut] || STATUT_STYLES.en_attente;
                      return (
                        <div key={p.id} className="flex items-center justify-between rounded-2xl bg-wave-50/60 px-3 py-2.5">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-semibold capitalize">{p.type}</p>
                              <St.icon className={`h-3 w-3 shrink-0 ${St.cls}`} />
                            </div>
                            <p className="text-[10px] text-wave-500 truncate">{p.date_paiement} · {p.mode}</p>
                          </div>
                          <span className="shrink-0 text-sm font-bold text-brand-600">+{fcfa(p.montant)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default function Page() { return <Suspense fallback={null}><Inner /></Suspense>; }
