"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowUpRight, CheckCircle2, Clock, XCircle, Ban, X, Eye, Hash, Wallet, Calendar, Tag, AlertTriangle } from "lucide-react";
import AppShell from "../../../../components/AppShell";
import { api, fcfa, API_BASE } from "../../../../lib/api";
import { fmtDate, fmtTime, fmtDateFull } from "../../../../lib/utils";

const STATUT_ICON = {
  reussi: { Icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-600 border border-emerald-100" },
  en_attente: { Icon: Clock, cls: "bg-amber-50 text-amber-600 border border-amber-100" },
  echoue: { Icon: XCircle, cls: "bg-rose-50 text-rose-600 border border-rose-100" },
  annule: { Icon: Ban, cls: "bg-slate-50 text-slate-500 border border-slate-200" },
};

const STATUT_LABEL = {
  reussi: "Réussi",
  en_attente: "En attente",
  echoue: "Échoué",
  annule: "Annulé",
};

/**
 * Regroupe les paiements par date (style Wave) en utilisant created_at pour le tri.
 */
function groupByDate(paiements) {
  const sorted = [...paiements].sort((a, b) => {
    const da = new Date(a.created_at || a.date_paiement);
    const db = new Date(b.created_at || b.date_paiement);
    return db - da; // Plus récent en premier
  });

  const groups = [];
  let currentDate = null;
  let currentGroup = null;

  for (const p of sorted) {
    const d = new Date(p.created_at || p.date_paiement);
    const dateKey = d.toISOString().slice(0, 10);

    if (dateKey !== currentDate) {
      currentDate = dateKey;
      currentGroup = { date: dateKey, dateObj: d, paiements: [] };
      groups.push(currentGroup);
    }
    currentGroup.paiements.push(p);
  }

  return groups;
}

/**
 * Formate le label de la date pour les en-têtes de groupe (style Wave).
 */
function formatGroupDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (dateStr === today) return "Aujourd'hui";
  if (dateStr === yesterdayStr) return "Hier";

  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function MesPaiements() {
  const { id } = useParams();
  const [data, setData] = useState({ paiements: [], membre: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const [preuveUrl, setPreuveUrl] = useState(null);
  const [preuveLoading, setPreuveLoading] = useState(false);
  const [preuveError, setPreuveError] = useState(null);

  useEffect(()=>{
    if (!id || id === 'undefined') return;
    api.get(`/groupes/${id}/mes-paiements`).then((response)=>{
      setData(response.data); setLoading(false);
    }).catch(() => {
      setError("Impossible de charger vos paiements.");
      setLoading(false);
    });
  }, [id]);

  const total = data.paiements.filter(p=>p.statut==="reussi").reduce((sum,p)=>sum+p.montant, 0);
  const dateGroups = groupByDate(data.paiements);

  return (
    <AppShell title="Mes paiements" role="membre" groupeId={id} back>
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i=><div key={i} className="h-20 animate-pulse rounded-[1.5rem] bg-wave-100/60"/>)}
        </div>
      ) : error ? (
        <div className="rounded-3xl bg-rose-50 py-12 text-center border-2 border-dashed border-rose-200">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-white text-rose-400 shadow-sm">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium text-rose-600">{error}</p>
        </div>
      ) : (
        <>
          {data.paiements.length > 0 && (
            <div className="mb-4 flex items-center justify-between px-1">
              <p className="text-xs font-bold text-wave-400 uppercase tracking-wider">{data.paiements.length} paiement{data.paiements.length>1?"s":""}</p>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-wave-500">Total versé :</span>
                <span className="text-sm font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">{fcfa(total)}</span>
              </div>
            </div>
          )}
          {data.paiements.length === 0 ? (
            <div className="rounded-3xl bg-wave-50 py-12 text-center border-2 border-dashed border-wave-200">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-white text-wave-400 shadow-sm">
                <Wallet className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-wave-500">Aucun paiement enregistré.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {dateGroups.map((group) => (
                <div key={group.date}>
                  {/* En-tête de date style Wave */}
                  <div className="flex items-center gap-3 mb-2.5 px-1">
                    <p className="text-[11px] font-black uppercase tracking-wider text-wave-400 whitespace-nowrap">
                      {formatGroupDate(group.date)}
                    </p>
                    <div className="flex-1 h-px bg-wave-100"></div>
                  </div>

                  <div className="space-y-2">
                    {group.paiements.map((paiement, idx)=>{
                      const statutIcon = STATUT_ICON[paiement.statut] || STATUT_ICON.reussi;
                      const heureStr = fmtTime(paiement.created_at || paiement.date_paiement);
                      return (
                        <motion.button
                          key={paiement.id}
                          initial={{opacity:0,y:8}}
                          animate={{opacity:1,y:0}}
                          transition={{delay:idx*0.02}}
                          onClick={() => { setSelected(paiement); setPreuveUrl(null); setPreuveError(null); }}
                          className="w-full text-left flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-wave-100 active:scale-[0.98] transition-transform"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${statutIcon.cls}`}>
                              <statutIcon.Icon className="h-5 w-5"/>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-extrabold text-wave-900 capitalize">{paiement.type}</p>
                              {paiement.periode && (
                                <p className="text-[10px] font-medium text-brand-600 mt-0.5">
                                  Période : {new Date(paiement.periode.date_debut).toLocaleDateString("fr-FR", { day: '2-digit', month: 'short' })} - {new Date(paiement.periode.date_fin).toLocaleDateString("fr-FR", { day: '2-digit', month: 'short' })}
                                </p>
                              )}
                              <p className="text-[11px] font-medium text-wave-400 mt-0.5">{heureStr} · {paiement.mode}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <p className={`shrink-0 text-base font-extrabold ${paiement.statut==="reussi"?"text-emerald-600":"text-wave-500"}`}>
                              +{fcfa(Math.ceil((paiement.montant * 1.01 + 100) / 0.975)).replace(' FCFA', '')}
                            </p>
                            <p className="text-[10px] font-semibold text-wave-400 mt-0.5">Dont {fcfa(paiement.montant)} reçu</p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-wave-900/40 backdrop-blur-sm sm:place-items-center" onClick={() => setSelected(null)}>
          <motion.div
            initial={{y:60,opacity:0}}
            animate={{y:0,opacity:1}}
            transition={{type:"spring",damping:25,stiffness:300}}
            onClick={(e)=>e.stopPropagation()}
            className="flex flex-col w-full max-w-md rounded-t-3xl bg-white shadow-soft sm:rounded-3xl max-h-[90vh]"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-wave-100 px-5 py-4">
              <h3 className="font-display text-lg font-extrabold text-wave-950">Détails du paiement</h3>
              <button onClick={() => setSelected(null)} className="grid h-9 w-9 place-items-center rounded-full border border-wave-100 text-wave-500 transition hover:bg-wave-50 hover:text-wave-700">
                <X className="h-4 w-4"/>
              </button>
            </div>

            <div className="overflow-y-auto px-5 pb-5">
              <div className="space-y-3.5 pt-3.5">
                <div className="rounded-2xl bg-wave-50 p-4 border border-wave-100 flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-100 text-brand-600"><Wallet className="h-6 w-6"/></span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">Montant total payé</p>
                      <p className="text-xl font-extrabold text-wave-900">{fcfa(Math.ceil((selected.montant * 1.01 + 100) / 0.975))}</p>
                      <p className="text-[10px] font-semibold text-wave-500 mt-1">Le groupe a reçu : {fcfa(selected.montant)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {selected.statut === "reussi" && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Réussi</span>}
                    {selected.statut === "en_attente" && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-100 px-2.5 py-1 text-xs font-bold text-amber-600"><Clock className="h-4 w-4" /> En attente</span>}
                    {selected.statut === "echoue" && <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-100 px-2.5 py-1 text-xs font-bold text-rose-600"><XCircle className="h-4 w-4" /> Échoué</span>}
                    {selected.statut === "annule" && <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-500"><Ban className="h-4 w-4" /> Annulé</span>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-wave-50 p-4 border border-wave-100">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">Date</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-wave-500" />
                      <span className="text-sm font-bold text-wave-800">{fmtDate(selected.date_paiement)}</span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-wave-50 p-4 border border-wave-100">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">Heure</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-wave-500" />
                      <span className="text-sm font-bold text-wave-800">{fmtTime(selected.created_at) || "—"}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-wave-50 p-4 border border-wave-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">Mode de paiement</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Wallet className="h-4 w-4 text-wave-500" />
                      <span className="text-sm font-bold capitalize text-wave-800">{selected.mode}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">Type</p>
                    <p className="text-sm font-bold capitalize text-wave-800 mt-1">
                      {selected.type}
                    </p>
                    {selected.periode && (
                      <p className="text-[10px] font-medium text-brand-600 mt-0.5">
                        {new Date(selected.periode.date_debut).toLocaleDateString("fr-FR", { day: '2-digit', month: 'short' })} - {new Date(selected.periode.date_fin).toLocaleDateString("fr-FR", { day: '2-digit', month: 'short' })}
                      </p>
                    )}
                  </div>
                  <Tag className="h-5 w-5 text-wave-400" />
                </div>

                {selected.transaction_id && (
                  <div className="rounded-2xl bg-wave-50 p-4 border border-wave-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">Référence Wave</p>
                      <p className="text-sm font-extrabold text-wave-800 mt-1">{selected.transaction_id}</p>
                    </div>
                    <Hash className="h-5 w-5 text-wave-400" />
                  </div>
                )}

                {(selected.statut === "echoue" || selected.statut === "annule") && (
                  <div className="rounded-2xl bg-rose-50 border border-rose-100 p-4 flex items-start gap-3">
                    <XCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                        {selected.statut === "annule" ? "Paiement annulé" : "Paiement échoué"}
                      </p>
                      <p className="mt-1 text-sm text-rose-600">
                        {selected.statut === "annule"
                          ? "Vous avez annulé ce paiement. Aucun montant n'a été débité."
                          : "Ce paiement n'a pas pu aboutir. Veuillez réessayer ou contacter le support Wave."}
                      </p>
                    </div>
                  </div>
                )}

                {selected.preuve_path && (
                  <div className="pt-2">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-wave-400">Preuve de paiement</p>
                    {preuveUrl ? (
                      <div className="rounded-2xl overflow-hidden border-2 border-wave-100 bg-white">
                        <img src={preuveUrl} alt="Reçu de paiement" className="w-full object-cover" />
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={async () => {
                            setPreuveLoading(true);
                            setPreuveError(null);
                            try {
                              const response = await api.get(`/groupes/${id}/paiements/${selected.id}/preuve`, { responseType: "blob" });
                              setPreuveUrl(URL.createObjectURL(response.data));
                            } catch (err) {
                              setPreuveError("Impossible de charger le reçu.");
                            }
                            setPreuveLoading(false);
                          }}
                          disabled={preuveLoading}
                          className="flex items-center justify-center gap-2 rounded-2xl bg-wave-50 py-3 text-sm font-bold text-wave-700 border border-wave-100 w-full disabled:opacity-50 transition active:scale-95"
                        >
                          <Eye className="h-4.5 w-4.5" /> {preuveLoading ? "Chargement..." : "Voir le reçu"}
                        </button>
                        {preuveError && <p className="mt-2 text-xs text-rose-600 text-center">{preuveError}</p>}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AppShell>
  );
}
