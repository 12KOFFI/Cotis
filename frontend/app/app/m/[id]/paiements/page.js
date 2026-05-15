"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowUpRight, CheckCircle2, Clock, XCircle, X, Eye, Hash, Wallet, Calendar, Tag } from "lucide-react";
import AppShell from "../../../../components/AppShell";
import { api, fcfa, API_BASE } from "../../../../lib/api";

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "";

const STATUT_ICON = {
  reussi: { Icon: CheckCircle2, cls: "bg-brand-50 text-brand-600" },
  en_attente: { Icon: Clock, cls: "bg-amber-50 text-amber-600" },
  echoue: { Icon: XCircle, cls: "bg-red-50 text-red-600" },
};

const STATUT_LABEL = {
  reussi: "Réussi",
  en_attente: "En attente",
  echoue: "Échoué",
};

export default function MesPaiements() {
  const { id } = useParams();
  const [data, setData] = useState({ paiements: [], membre: null });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const STORAGE_URL = API_BASE.replace("/api", "/storage/");

  useEffect(()=>{
    api.get(`/groupes/${id}/mes-paiements`).then((r)=>{
      setData(r.data); setLoading(false);
    });
  }, [id]);

  const total = data.paiements.filter(p=>p.statut==="reussi").reduce((s,p)=>s+p.montant, 0);

  return (
    <AppShell title="Mes paiements" role="membre" groupeId={id} back>
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i=><div key={i} className="h-[68px] animate-pulse rounded-2xl bg-wave-100/60"/>)}
        </div>
      ) : (
        <>
          {data.paiements.length > 0 && (
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs text-wave-500">{data.paiements.length} paiement{data.paiements.length>1?"s":""}</p>
              <p className="text-xs font-semibold text-wave-700">Total : {fcfa(total)}</p>
            </div>
          )}
          {data.paiements.length === 0 ? (
            <p className="py-16 text-center text-sm text-wave-500">Aucun paiement enregistré.</p>
          ) : (
            <div className="space-y-2">
              {data.paiements.map((p, idx)=>{
                const si = STATUT_ICON[p.statut] || STATUT_ICON.reussi;
                return (
                  <motion.button key={p.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:idx*0.02}} onClick={() => setSelected(p)} className="w-full text-left card flex items-center gap-3 transition hover:-translate-y-0.5">
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${si.cls}`}><si.Icon className="h-4 w-4"/></span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold capitalize">{p.type}{p.periode ? ` · ${fmtDate(p.periode.date_debut)}` : ""}</p>
                      <p className="text-[11px] text-wave-400">{fmtDate(p.date_paiement)} · {p.mode}</p>
                    </div>
                    <p className={`shrink-0 text-sm font-bold ${p.statut==="reussi"?"text-brand-600":"text-wave-600"}`}>+{fcfa(p.montant)}</p>
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
              <h3 className="font-display text-lg font-extrabold">Détails du paiement</h3>
              <button onClick={() => setSelected(null)} className="grid h-9 w-9 place-items-center rounded-full border border-wave-100 text-wave-500 transition hover:bg-wave-50 hover:text-wave-700">
                <X className="h-4 w-4"/>
              </button>
            </div>

            <div className="overflow-y-auto px-5 pb-5">
              <div className="space-y-3 pt-3">
                <div className="rounded-2xl bg-wave-50 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-600"><Wallet className="h-5 w-5"/></span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-wave-500">Montant</p>
                      <p className="text-xl font-extrabold text-wave-900">{fcfa(selected.montant)}</p>
                    </div>
                  </div>
                  {selected.statut === "reussi" && <CheckCircle2 className="h-6 w-6 text-emerald-500" />}
                  {selected.statut === "en_attente" && <Clock className="h-6 w-6 text-amber-500" />}
                  {selected.statut === "echoue" && <XCircle className="h-6 w-6 text-red-500" />}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-2xl bg-wave-50 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">Date</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-wave-500" />
                      <span className="text-sm font-semibold text-wave-800">{fmtDate(selected.date_paiement)}</span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-wave-50 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">Statut</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      {(() => {
                        const si = STATUT_ICON[selected.statut] || STATUT_ICON.reussi;
                        const label = STATUT_LABEL[selected.statut] || "Réussi";
                        return <><si.Icon className="h-3.5 w-3.5" /><span className="text-sm font-semibold text-wave-800">{label}</span></>;
                      })()}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-wave-50 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">Type</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-wave-500" />
                    <span className="text-sm font-semibold capitalize text-wave-800">{selected.type}</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-wave-50 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">Mode de paiement</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5 text-wave-500" />
                    <span className="text-sm font-semibold capitalize text-wave-800">{selected.mode}</span>
                  </div>
                </div>

                {selected.transaction_id && (
                  <div className="rounded-2xl bg-wave-50 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">Référence</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5 text-wave-500" />
                      <span className="text-sm font-bold text-wave-800">{selected.transaction_id}</span>
                    </div>
                  </div>
                )}

                {selected.note && (
                  <div className="rounded-2xl bg-wave-50 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">Note</p>
                    <p className="mt-1 text-sm text-wave-700">{selected.note}</p>
                  </div>
                )}

                {selected.preuve_path && (
                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-wave-400">Preuve de paiement</p>
                    <div className="rounded-2xl overflow-hidden border-2 border-wave-200">
                      <img src={STORAGE_URL + selected.preuve_path} alt="Reçu de paiement" className="w-full object-cover" />
                    </div>
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
