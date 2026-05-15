"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft, Minus, TrendingUp, TrendingDown, X, CheckCircle2, Clock, CreditCard, Wallet, Hash, Calendar, Eye } from "lucide-react";
import AppShell from "../../../../components/AppShell";
import { api, fcfa, API_BASE } from "../../../../lib/api";

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "";

export default function CaissePage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [decOpen, setDecOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const STORAGE_URL = API_BASE.replace("/api", "/storage/");

  async function load(){
    const r = await api.get(`/groupes/${id}/caisse`);
    setData(r.data); setLoading(false);
  }
  useEffect(()=>{ load(); }, [id]);

  return (
    <AppShell title="Caisse" groupeId={id} back>
      {loading ? (
        <div className="space-y-3">
          <div className="h-44 animate-pulse rounded-3xl bg-wave-100/60"/>
          <div className="h-10 animate-pulse rounded-2xl bg-wave-100/60"/>
        </div>
      ) : (
        <>
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="overflow-hidden rounded-3xl wave-bg text-white shadow-soft">
            <div className="p-5">
              <p className="text-[10px] uppercase tracking-widest text-white/60">Solde actuel</p>
              <motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.2}} className="mt-1 font-display text-[2rem] font-extrabold leading-none">
                {fcfa(data.caisse?.solde || 0)}
              </motion.p>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2.5 rounded-2xl bg-white/10 p-3">
                  <TrendingUp className="h-4 w-4 text-white/70"/>
                  <div>
                    <p className="text-[10px] text-white/60">Entrées</p>
                    <p className="font-display text-base font-bold">{fcfa(data.total_entrees)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 rounded-2xl bg-white/10 p-3">
                  <TrendingDown className="h-4 w-4 text-white/70"/>
                  <div>
                    <p className="text-[10px] text-white/60">Sorties</p>
                    <p className="font-display text-base font-bold">{fcfa(data.total_sorties)}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-white/10 px-5 py-3">
              <button onClick={()=>setDecOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-wave-800 transition hover:bg-wave-50">
                <Minus className="h-4 w-4"/> Décaisser
              </button>
            </div>
          </motion.div>

          <div className="mt-6 flex items-center justify-between">
            <h3 className="font-display text-lg font-bold">Grand livre</h3>
            <span className="text-xs text-wave-500">{data.ledger.length} mouvement{data.ledger.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="mt-3 space-y-2">
            {data.ledger.length === 0 ? (
              <p className="py-10 text-center text-sm text-wave-500">Aucun mouvement enregistré.</p>
            ) : data.ledger.map((l, idx)=>(
              <motion.button
                key={l.id}
                initial={{opacity:0,y:8}}
                animate={{opacity:1,y:0}}
                transition={{delay:idx*0.02}}
                onClick={() => setSelectedEntry(l)}
                className="w-full text-left card flex items-center gap-3 transition hover:-translate-y-0.5"
              >
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${l.type==="entree" ? "bg-brand-50 text-brand-600" : "bg-red-50 text-red-600"}`}>
                  {l.type==="entree" ? <ArrowUpRight className="h-4 w-4"/> : <ArrowDownLeft className="h-4 w-4"/>}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold">{l.motif}</p>
                  <p className="text-[11px] text-wave-400">{fmtDate(l.date)}{l.beneficiaire ? ` · ${l.beneficiaire}` : ""}</p>
                </div>
                <p className={`shrink-0 text-sm font-bold ${l.type==="entree"?"text-brand-600":"text-red-600"}`}>
                  {l.type==="entree"?"+":"-"}{fcfa(l.montant)}
                </p>
              </motion.button>
            ))}
          </div>
        </>
      )}
      {decOpen && <DecaissementModal groupeId={id} max={data?.caisse?.solde||0} onClose={()=>{setDecOpen(false);load();}}/>}

      {selectedEntry && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-wave-900/40 backdrop-blur-sm sm:place-items-center" onClick={() => setSelectedEntry(null)}>
          <motion.div
            initial={{y:60,opacity:0}}
            animate={{y:0,opacity:1}}
            transition={{type:"spring",damping:25,stiffness:300}}
            onClick={(e)=>e.stopPropagation()}
            className="flex flex-col w-full max-w-md rounded-t-3xl bg-white shadow-soft sm:rounded-3xl max-h-[90vh]"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-wave-100 px-5 py-4">
              <h3 className="font-display text-lg font-extrabold">Détails du mouvement</h3>
              <button onClick={() => setSelectedEntry(null)} className="grid h-9 w-9 place-items-center rounded-full border border-wave-100 text-wave-500 transition hover:bg-wave-50 hover:text-wave-700">
                <X className="h-4 w-4"/>
              </button>
            </div>

            <div className="overflow-y-auto px-5 pb-5">
              <div className="space-y-3 pt-3">
                <div className={`rounded-2xl p-4 flex items-center justify-between ${selectedEntry.type === "entree" ? "bg-brand-50" : "bg-red-50"}`}>
                  <div className="flex items-center gap-3">
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${selectedEntry.type === "entree" ? "bg-brand-100 text-brand-600" : "bg-red-100 text-red-600"}`}>
                      {selectedEntry.type === "entree" ? <ArrowUpRight className="h-5 w-5"/> : <ArrowDownLeft className="h-5 w-5"/>}
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-wave-500">Montant</p>
                      <p className="text-xl font-extrabold text-wave-900">{fcfa(selectedEntry.montant)}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${selectedEntry.type === "entree" ? "bg-brand-200 text-brand-700" : "bg-red-200 text-red-700"}`}>
                    {selectedEntry.type}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-2xl bg-wave-50 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">Date</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-wave-500" />
                      <span className="text-sm font-semibold text-wave-800">{fmtDate(selectedEntry.date)}</span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-wave-50 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">Type</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      {selectedEntry.type === "entree" ? <ArrowUpRight className="h-3.5 w-3.5 text-brand-600" /> : <ArrowDownLeft className="h-3.5 w-3.5 text-red-600" />}
                      <span className={`text-sm font-semibold capitalize ${selectedEntry.type === "entree" ? "text-brand-700" : "text-red-700"}`}>{selectedEntry.type}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-wave-50 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">Motif</p>
                  <p className="mt-1 text-sm font-semibold text-wave-800">{selectedEntry.motif}</p>
                </div>

                {selectedEntry.beneficiaire && (
                  <div className="rounded-2xl bg-wave-50 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">Bénéficiaire</p>
                    <p className="mt-1 text-sm font-semibold text-wave-800">{selectedEntry.beneficiaire}</p>
                  </div>
                )}

                {selectedEntry.paiement && (
                  <>
                    <div className="pt-2 border-t border-wave-100">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400 mb-2">Paiement associé</p>
                    </div>
                    <div className="rounded-2xl bg-brand-50 p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-600"><Wallet className="h-4 w-4"/></span>
                        <div>
                          <p className="text-sm font-bold text-wave-900">{selectedEntry.paiement.membre?.prenom} {selectedEntry.paiement.membre?.nom}</p>
                          <p className="text-[10px] text-wave-500">{selectedEntry.paiement.mode} · {selectedEntry.paiement.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-brand-600">{fcfa(selectedEntry.paiement.montant)}</p>
                      </div>
                    </div>
                    {selectedEntry.paiement.transaction_id && (
                      <div className="rounded-2xl bg-wave-50 p-3.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">Référence</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <Hash className="h-3.5 w-3.5 text-wave-500" />
                          <span className="text-sm font-bold text-wave-800">{selectedEntry.paiement.transaction_id}</span>
                        </div>
                      </div>
                    )}
                    {selectedEntry.paiement.preuve_path && (
                      <div>
                        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-wave-400">Preuve de paiement</p>
                        <div className="rounded-2xl overflow-hidden border-2 border-wave-200">
                          <img src={STORAGE_URL + selectedEntry.paiement.preuve_path} alt="Preuve" className="w-full object-cover" />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AppShell>
  );
}

function DecaissementModal({ groupeId, max, onClose }) {
  const [f, setF] = useState({ montant: 0, motif: "", beneficiaire: "", date: new Date().toISOString().slice(0,10) });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(){
    setErr(""); setLoading(true);
    try {
      await api.post(`/groupes/${groupeId}/caisse/decaissement`, f);
      onClose();
    } catch(e){ setErr(e.response?.data?.message || "Erreur"); }
    finally { setLoading(false); }
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-wave-900/40 backdrop-blur-sm sm:place-items-center" onClick={onClose}>
      <motion.div
        initial={{y:60,opacity:0}}
        animate={{y:0,opacity:1}}
        transition={{type:"spring",damping:25,stiffness:300}}
        onClick={(e)=>e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-soft sm:rounded-3xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-extrabold">Décaisser</h3>
            <p className="mt-0.5 text-xs text-wave-500">Solde disponible : {fcfa(max)}</p>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-wave-100 text-wave-500 transition hover:bg-wave-50 hover:text-wave-700">✕</button>
        </div>
        <div className="space-y-3">
          <div><label className="label">Montant (FCFA)</label><input type="number" min="1" max={max} className="input" value={f.montant} onChange={(e)=>setF({...f,montant:parseInt(e.target.value)||0})}/></div>
          <div><label className="label">Motif *</label><input className="input" value={f.motif} onChange={(e)=>setF({...f,motif:e.target.value})} placeholder="Ex: Achat fournitures"/></div>
          <div><label className="label">Bénéficiaire</label><input className="input" value={f.beneficiaire} onChange={(e)=>setF({...f,beneficiaire:e.target.value})}/></div>
          <div><label className="label">Date</label><input type="date" className="input" value={f.date} onChange={(e)=>setF({...f,date:e.target.value})}/></div>
          {err && <motion.p initial={{opacity:0,y:-5}} animate={{opacity:1,y:0}} className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{err}</motion.p>}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="btn-ghost flex-1 !py-3">Annuler</button>
            <button onClick={submit} disabled={loading || !f.montant || !f.motif} className="btn-primary flex-1 !py-3">{loading?"Décaissement...":"Décaisser"}</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
