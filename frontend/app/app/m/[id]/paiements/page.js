"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowUpRight, CheckCircle2, Clock, XCircle, Ban, X, Eye, Hash, Wallet, Calendar, Tag, AlertTriangle } from "lucide-react";
import AppShell from "../../../../components/AppShell";
import { api, fcfa, API_BASE } from "../../../../lib/api";
import { fmtDate } from "../../../../lib/utils";

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
            <div className="space-y-2.5">
              {data.paiements.map((paiement, idx)=>{
                const statutIcon = STATUT_ICON[paiement.statut] || STATUT_ICON.reussi;
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
                        <p className="truncate text-sm font-extrabold text-wave-900 capitalize">{paiement.type}{paiement.periode ? ` · ${fmtDate(paiement.periode.date_debut)}` : ""}</p>
                        <p className="text-[11px] font-medium text-wave-400 mt-0.5">{fmtDate(paiement.date_paiement)} · {paiement.mode}</p>
                      </div>
                    </div>
                    <p className={`shrink-0 text-base font-extrabold ${paiement.statut==="reussi"?"text-emerald-600":"text-wave-500"}`}>
                      +{fcfa(paiement.montant).replace(' FCFA', '')}
                    </p>
                  </motion.button>
                );
              })}
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
                      <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">Montant</p>
                      <p className="text-xl font-extrabold text-wave-900">{fcfa(selected.montant)}</p>
                    </div>
                  </div>
                  {selected.statut === "reussi" && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-600"><CheckCircle2 className="h-4 w-4" /> Réussi</span>}
                  {selected.statut === "en_attente" && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-100 px-2.5 py-1 text-xs font-bold text-amber-600"><Clock className="h-4 w-4" /> En attente</span>}
                  {selected.statut === "echoue" && <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-100 px-2.5 py-1 text-xs font-bold text-rose-600"><XCircle className="h-4 w-4" /> Échoué</span>}
                  {selected.statut === "annule" && <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-500"><Ban className="h-4 w-4" /> Annulé</span>}
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
                    <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">Mode</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Wallet className="h-4 w-4 text-wave-500" />
                      <span className="text-sm font-bold capitalize text-wave-800">{selected.mode}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-wave-50 p-4 border border-wave-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">Type de cotisation</p>
                    <p className="text-sm font-bold capitalize text-wave-800 mt-1">{selected.type}</p>
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

                {selected.note && (
                  <div className="rounded-2xl bg-wave-50 p-4 border border-wave-100">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">Note</p>
                    <p className="mt-1 text-sm font-semibold text-wave-700">{selected.note}</p>
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
