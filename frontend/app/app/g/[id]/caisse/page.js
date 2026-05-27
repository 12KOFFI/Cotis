"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Minus,
  TrendingUp,
  TrendingDown,
  X,
  CheckCircle2,
  Clock,
  CreditCard,
  Wallet,
  Hash,
  Calendar,
  Eye,
  History,
} from "lucide-react";
import AppShell from "../../../../components/AppShell";
import { api, fcfa, API_BASE } from "../../../../lib/api";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

export default function CaissePage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [decOpen, setDecOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const [preuveUrl, setPreuveUrl] = useState(null);
  const [preuveLoading, setPreuveLoading] = useState(false);

  async function load() {
    const r = await api.get(`/groupes/${id}/caisse`);
    setData(r.data);
    setLoading(false);
  }
  useEffect(() => {
    if (!id || id === "undefined") return;
    load();
  }, [id]);

  return (
    <AppShell title="Caisse" groupeId={id} back>
      {loading ? (
        <div className="space-y-3">
          <div className="h-44 animate-pulse rounded-3xl bg-wave-100/60" />
          <div className="h-10 animate-pulse rounded-2xl bg-wave-100/60" />
        </div>
      ) : (
        <>
          {/* CARTE SOLDE PRINCIPALE */}
          <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="relative mb-6 overflow-hidden rounded-[2rem] bg-brand-600 p-6 text-white shadow-xl shadow-brand-500/30">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-brand-400/20 blur-2xl"></div>
            
            <div className="relative text-center pt-2 pb-2">
              <p className="text-sm font-medium text-brand-100 mb-1">Caisse totale</p>
              <div className="flex items-center justify-center gap-1">
                <span className="text-[2.75rem] font-display font-extrabold tracking-tight">{fcfa(data.solde_total || 0).replace(' FCFA', '')}</span>
                <span className="text-xl font-bold text-brand-200 mt-3">F</span>
              </div>

              {/* Bouton d'action principal bien visible */}
              <button onClick={() => setDecOpen(true)} className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-base font-extrabold text-brand-600 shadow-sm transition-transform active:scale-95">
                <ArrowDownLeft className="h-6 w-6" />
                Décaisser l'argent
              </button>
            </div>
          </motion.div>

          {/* INFO RETIRABLE WAVE */}
          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.1}} className="mb-6 rounded-[1.5rem] bg-brand-50 p-4 border border-brand-100 flex items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-100 text-brand-600">
              <Wallet className="h-6 w-6"/>
            </div>
            <div>
              <p className="text-xs font-bold text-brand-600">Retirable via Wave</p>
              <p className="text-lg font-extrabold text-brand-700">{fcfa(data.solde_disponible || 0)}</p>
            </div>
          </motion.div>

          {/* RÉSUMÉ ENTRÉES/SORTIES */}
          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.15}} className="mb-8 grid grid-cols-2 gap-3">
            <div className="rounded-[1.5rem] bg-emerald-50 p-4 border border-emerald-100/50">
              <div className="mb-2 flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                  <ArrowUpRight className="h-4 w-4"/>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600">Entrées</p>
              </div>
              <p className="text-xl font-extrabold text-emerald-700">{fcfa(data.total_entrees).replace(' FCFA', '')}</p>
            </div>
            
            <div className="rounded-[1.5rem] bg-rose-50 p-4 border border-rose-100/50">
              <div className="mb-2 flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-rose-100 text-rose-600">
                  <ArrowDownLeft className="h-4 w-4"/>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-rose-600">Sorties</p>
              </div>
              <p className="text-xl font-extrabold text-rose-700">{fcfa(data.total_sorties).replace(' FCFA', '')}</p>
            </div>
          </motion.div>

          {/* HISTORIQUE DU GRAND LIVRE */}
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-base font-bold text-wave-900">Mouvements</h3>
            <span className="text-xs font-medium text-wave-500 bg-wave-50 px-2 py-1 rounded-md">{data.ledger.length} opération{data.ledger.length !== 1 ? "s" : ""}</span>
          </div>
          
          <div className="space-y-2.5 pb-10">
            {data.ledger.length === 0 ? (
              <div className="rounded-[1.5rem] bg-wave-50 py-8 text-center border-2 border-dashed border-wave-200">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-white text-wave-400 shadow-sm">
                  <History className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-wave-500">Aucun mouvement</p>
              </div>
            ) : data.ledger.map((l, idx)=>(
              <motion.button
                key={l.id}
                initial={{opacity:0,y:8}}
                animate={{opacity:1,y:0}}
                transition={{delay:idx*0.02}}
                onClick={() => setSelectedEntry(l)}
                className="w-full text-left flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-wave-100 active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${l.type==="entree" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                    {l.type==="entree" ? <ArrowUpRight className="h-5 w-5"/> : <ArrowDownLeft className="h-5 w-5"/>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-wave-900">{l.motif}</p>
                    <p className="text-[11px] font-medium text-wave-500">{fmtDate(l.date)}{l.beneficiaire ? ` • ${l.beneficiaire}` : ""}</p>
                  </div>
                </div>
                <p className={`shrink-0 text-base font-extrabold ${l.type==="entree"?"text-emerald-600":"text-rose-600"}`}>
                  {l.type==="entree"?"+":"-"}{fcfa(l.montant).replace(' FCFA', '')}
                </p>
              </motion.button>
            ))}
          </div>
        </>
      )}
      {decOpen && (
        <DecaissementModal
          groupeId={id}
          max={data?.solde_disponible || 0}
          onClose={() => {
            setDecOpen(false);
            load();
          }}
        />
      )}

      {selectedEntry && (
        <div
          className="fixed inset-0 z-50 grid place-items-end bg-wave-900/40 backdrop-blur-sm sm:place-items-center"
          onClick={() => setSelectedEntry(null)}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col w-full max-w-md rounded-t-3xl bg-white shadow-soft sm:rounded-3xl max-h-[90vh]"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-wave-100 px-5 py-4">
              <h3 className="font-display text-lg font-extrabold">
                Détails du mouvement
              </h3>
              <button
                onClick={() => setSelectedEntry(null)}
                className="grid h-9 w-9 place-items-center rounded-full border border-wave-100 text-wave-500 transition hover:bg-wave-50 hover:text-wave-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto px-5 pb-5">
              <div className="space-y-3 pt-3">
                <div
                  className={`rounded-2xl p-4 flex items-center justify-between ${selectedEntry.type === "entree" ? "bg-brand-50" : "bg-red-50"}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${selectedEntry.type === "entree" ? "bg-brand-100 text-brand-600" : "bg-red-100 text-red-600"}`}
                    >
                      {selectedEntry.type === "entree" ? (
                        <ArrowUpRight className="h-5 w-5" />
                      ) : (
                        <ArrowDownLeft className="h-5 w-5" />
                      )}
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-wave-500">
                        Montant
                      </p>
                      <p className="text-xl font-extrabold text-wave-900">
                        {fcfa(selectedEntry.montant)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${selectedEntry.type === "entree" ? "bg-brand-200 text-brand-700" : "bg-red-200 text-red-700"}`}
                  >
                    {selectedEntry.type}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="rounded-2xl bg-wave-50 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">
                      Date
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-wave-500" />
                      <span className="text-sm font-semibold text-wave-800">
                        {fmtDate(selectedEntry.date)}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-wave-50 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">
                      Type
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      {selectedEntry.type === "entree" ? (
                        <ArrowUpRight className="h-3.5 w-3.5 text-brand-600" />
                      ) : (
                        <ArrowDownLeft className="h-3.5 w-3.5 text-red-600" />
                      )}
                      <span
                        className={`text-sm font-semibold capitalize ${selectedEntry.type === "entree" ? "text-brand-700" : "text-red-700"}`}
                      >
                        {selectedEntry.type}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-wave-50 p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">
                    Motif
                  </p>
                  <p className="mt-1 text-sm font-semibold text-wave-800">
                    {selectedEntry.motif}
                  </p>
                </div>

                {selectedEntry.beneficiaire && (
                  <div className="rounded-2xl bg-wave-50 p-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">
                      Bénéficiaire
                    </p>
                    <p className="mt-1 text-sm font-semibold text-wave-800">
                      {selectedEntry.beneficiaire}
                    </p>
                  </div>
                )}

                {selectedEntry.paiement && (
                  <>
                    <div className="pt-2 border-t border-wave-100">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400 mb-2">
                        Paiement associé
                      </p>
                    </div>
                    <div className="rounded-2xl bg-brand-50 p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-600">
                          <Wallet className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-wave-900">
                            {selectedEntry.paiement.membre?.prenom}{" "}
                            {selectedEntry.paiement.membre?.nom}
                          </p>
                          <p className="text-[10px] text-wave-500">
                            {selectedEntry.paiement.mode} ·{" "}
                            {selectedEntry.paiement.type}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-brand-600">
                          {fcfa(selectedEntry.paiement.montant)}
                        </p>
                      </div>
                    </div>
                    {selectedEntry.paiement.transaction_id && (
                      <div className="rounded-2xl bg-wave-50 p-3.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">
                          Référence
                        </p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <Hash className="h-3.5 w-3.5 text-wave-500" />
                          <span className="text-sm font-bold text-wave-800">
                            {selectedEntry.paiement.transaction_id}
                          </span>
                        </div>
                      </div>
                    )}
                    {selectedEntry.paiement.preuve_path && (
                      <div>
                        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-wave-400">
                          Preuve de paiement
                        </p>
                        {preuveUrl ? (
                          <div className="rounded-2xl overflow-hidden border-2 border-wave-200">
                            <img
                              src={preuveUrl}
                              alt="Preuve"
                              className="w-full object-cover"
                            />
                          </div>
                        ) : (
                          <button
                            onClick={async () => {
                              setPreuveLoading(true);
                              try {
                                const r = await api.get(
                                  `/groupes/${id}/paiements/${selectedEntry.paiement.id}/preuve`,
                                  { responseType: "blob" },
                                );
                                setPreuveUrl(URL.createObjectURL(r.data));
                              } catch {}
                              setPreuveLoading(false);
                            }}
                            disabled={preuveLoading}
                            className="flex items-center gap-2 rounded-xl bg-wave-50 px-3 py-2.5 text-xs font-semibold text-wave-700 transition hover:bg-brand-50 border border-wave-200 w-full disabled:opacity-50"
                          >
                            <Eye className="h-4 w-4" />{" "}
                            {preuveLoading ? "Chargement..." : "Voir la preuve"}
                          </button>
                        )}
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
  const [f, setF] = useState({
    montant: "",
    motif: "",
    beneficiaire: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit() {
    setErr("");
    setLoading(true);
    try {
      await api.post(`/groupes/${groupeId}/caisse/decaissement`, f);
      onClose();
    } catch (e) {
      setErr(e.response?.data?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-wave-900/40 backdrop-blur-sm sm:place-items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-soft sm:rounded-3xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-extrabold">Décaisser</h3>
            <p className="mt-0.5 text-xs text-wave-500">
              Solde retirable Wave : {fcfa(max)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-wave-100 text-wave-500 transition hover:bg-wave-50 hover:text-wave-700"
          >
            ✕
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="label">Montant (FCFA)</label>
            <input
              type="number"
              min="1"
              max={max}
              className="input"
              placeholder="Entrer un montant"
              value={f.montant}
              onChange={(e) =>
                setF({
                  ...f,
                  montant: e.target.value ? parseInt(e.target.value) : "",
                })
              }
            />
          </div>
          <div>
            <label className="label">Motif *</label>
            <input
              className="input"
              value={f.motif}
              onChange={(e) => setF({ ...f, motif: e.target.value })}
              placeholder="Ex: Achat fournitures"
            />
          </div>
          <div>
            <label className="label">Bénéficiaire</label>
            <input
              className="input"
              value={f.beneficiaire}
              onChange={(e) => setF({ ...f, beneficiaire: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={f.date}
              onChange={(e) => setF({ ...f, date: e.target.value })}
            />
          </div>
          {err && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700"
            >
              {err}
            </motion.p>
          )}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="btn-ghost flex-1 !py-3">
              Annuler
            </button>
            <button
              onClick={submit}
              disabled={loading || !f.montant || !f.motif}
              className="btn-primary flex-1 !py-3"
            >
              {loading ? "Décaissement..." : "Décaisser"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
