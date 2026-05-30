"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  Send,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import AppShell from "../../../../components/AppShell";
import PhoneInput from "../../../../components/PhoneInput";
import { api, fcfa, auth, API_BASE } from "../../../../lib/api";
import { fmtDate, fmtTime } from "../../../../lib/utils";

export default function CaissePage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [groupe, setGroupe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [decOpen, setDecOpen] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const [preuveUrl, setPreuveUrl] = useState(null);
  const [preuveLoading, setPreuveLoading] = useState(false);

  async function load() {
    const [r, grp] = await Promise.all([
      api.get(`/groupes/${id}/caisse`),
      api.get(`/groupes/${id}`),
    ]);
    setData(r.data);
    setGroupe(grp.data.groupe);
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

              {/* Boutons d'action */}
              <div className="mt-8 grid grid-cols-2 gap-2.5">
                <button onClick={() => setDecOpen(true)} className="flex items-center justify-center gap-2 rounded-2xl bg-white/90 py-3.5 text-sm font-extrabold text-brand-600 shadow-sm transition-transform active:scale-95">
                  <ArrowDownLeft className="h-5 w-5" />
                  Décaisser
                </button>
                <button onClick={() => setPayoutOpen(true)} className="flex items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-extrabold text-emerald-600 shadow-sm transition-transform active:scale-95 ring-2 ring-emerald-200">
                  <Send className="h-5 w-5" />
                  Retirer sur Wave
                </button>
              </div>
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
            ) : (() => {
              // Grouper les mouvements par date (style Wave)
              const sorted = [...data.ledger].sort((a, b) => {
                const da = new Date(a.created_at || a.date);
                const db = new Date(b.created_at || b.date);
                return db - da;
              });
              const groups = [];
              let currentDate = null;
              let currentGroup = null;
              for (const l of sorted) {
                const d = new Date(l.created_at || l.date);
                const dateKey = d.toISOString().slice(0, 10);
                if (dateKey !== currentDate) {
                  currentDate = dateKey;
                  currentGroup = { date: dateKey, items: [] };
                  groups.push(currentGroup);
                }
                currentGroup.items.push(l);
              }
              const formatGroupDate = (dateStr) => {
                const d = new Date(dateStr);
                const now = new Date();
                const today = now.toISOString().slice(0, 10);
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().slice(0, 10);
                if (dateStr === today) return "Aujourd'hui";
                if (dateStr === yesterdayStr) return "Hier";
                return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
              };

              return (
                <div className="space-y-5">
                  {groups.map((group) => (
                    <div key={group.date}>
                      <div className="flex items-center gap-3 mb-2.5 px-1">
                        <p className="text-[11px] font-black uppercase tracking-wider text-wave-400 whitespace-nowrap">
                          {formatGroupDate(group.date)}
                        </p>
                        <div className="flex-1 h-px bg-wave-100"></div>
                      </div>
                      <div className="space-y-2">
                        {group.items.map((l, idx) => {
                          const heureStr = fmtTime(l.created_at || l.date);
                          return (
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
                                  <p className="text-[11px] font-medium text-wave-500">{heureStr}{l.beneficiaire ? ` • ${l.beneficiaire}` : ""}</p>
                                </div>
                              </div>
                              <p className={`shrink-0 text-base font-extrabold ${l.type==="entree"?"text-emerald-600":"text-rose-600"}`}>
                                {l.type==="entree"?"+":"-"}{fcfa(l.montant).replace(' FCFA', '')}
                              </p>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
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

                <div className="grid grid-cols-3 gap-2.5">
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
                      Heure
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-wave-500" />
                      <span className="text-sm font-semibold text-wave-800">
                        {fmtTime(selectedEntry.created_at) || "—"}
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

      {/* MODAL RETRAIT WAVE — TÂCHE 2 + TÂCHE 3 */}
      <AnimatePresence>
        {payoutOpen && (
          <RetraitWaveModal
            groupeId={id}
            groupe={groupe}
            max={data?.solde_disponible || 0}
            onClose={() => { setPayoutOpen(false); load(); }}
          />
        )}
      </AnimatePresence>
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

/* ================================================================ */
/*  TÂCHE 2 + 3 — Modal Retrait Wave avec Calcul Frais Temps Réel    */
/* ================================================================ */

function RetraitWaveModal({ groupeId, groupe, max, onClose }) {
  // Pré-remplissage avec les infos du gestionnaire
  const user = auth.getUser();
  const [phone, setPhone] = useState(groupe?.wave_numero || user?.telephone || "");
  const [name, setName] = useState(user?.name || "");
  const [montant, setMontant] = useState("");
  const [netAmount, setNetAmount] = useState(null);
  const [feeData, setFeeData] = useState(null);
  const [feesLoading, setFeesLoading] = useState(false);

  // États du flux
  const [step, setStep] = useState("form"); // form | confirm | loading | result
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const debounceRef = useRef(null);

  // ── TÂCHE 3 : Calcul frais temps réel via backend ──
  const fetchFees = useCallback(async (amount) => {
    if (!amount || amount < 500) {
      setNetAmount(null);
      setFeeData(null);
      return;
    }
    setFeesLoading(true);
    try {
      const r = await api.get(`/groupes/${groupeId}/caisse/calculate-fees?amount=${amount}`);
      setNetAmount(r.data.net_amount);
      setFeeData(r.data);
    } catch {
      setNetAmount(null);
      setFeeData(null);
    } finally {
      setFeesLoading(false);
    }
  }, [groupeId]);

  // Debounce le calcul des frais (300ms)
  const handleAmountChange = (val) => {
    const num = val ? parseInt(val) : "";
    setMontant(num);
    setError("");

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchFees(num || 0);
    }, 300);
  };

  // Soumission du payout
  const submitPayout = async () => {
    setError("");
    setStep("loading");
    try {
      const r = await api.post(`/groupes/${groupeId}/caisse/payout`, {
        montant: Number(montant),
        recipient_phone: phone.replace(/\s/g, ""),
        recipient_name: name,
      });
      setResult(r.data);
      setStep("result");
    } catch (e) {
      const msg = e.response?.data?.message || "Le retrait a échoué. Veuillez réessayer.";
      setError(msg);
      setStep("form");
    }
  };

  const canSubmit = phone.replace(/\s/g, "").length >= 10 && name.trim() && montant >= 500 && montant <= max;
  const isSuccess = result?.success;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-wave-900/40 backdrop-blur-sm sm:place-items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col w-full max-w-md rounded-t-3xl bg-white shadow-soft sm:rounded-3xl max-h-[90vh]"
      >
        {/* HEADER */}
        <div className="flex shrink-0 items-center justify-between border-b border-wave-100 px-5 py-4">
          <div>
            <h3 className="font-display text-lg font-extrabold text-wave-950">
              {step === "result" ? (isSuccess ? "Retrait effectué" : "Échec du retrait") : "Retirer sur Wave"}
            </h3>
            {step === "form" && (
              <p className="text-xs text-wave-400 mt-0.5">Solde retirable : {fcfa(max)}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-wave-100 text-wave-500 transition hover:bg-wave-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-5">
          {/* ── ÉTAPE 1 : Formulaire ── */}
          {step === "form" && (
            <div className="space-y-4 pt-4">
              {/* Numéro Wave */}
              <div>
                <label className="label">Numéro Wave du destinataire</label>
                <PhoneInput value={phone} onChange={setPhone} defaultCountry="CI" />
              </div>

              {/* Nom du destinataire */}
              <div>
                <label className="label">Nom du destinataire</label>
                <input
                  className="input"
                  placeholder="Ex: Koné Ibrahim"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Montant + Net temps réel */}
              <div>
                <label className="label">Montant à retirer (FCFA)</label>
                <div className="relative">
                  <input
                    type="number"
                    className="input pr-20"
                    placeholder="Ex: 100 000"
                    min={500}
                    max={max}
                    value={montant}
                    onChange={(e) => handleAmountChange(e.target.value)}
                  />
                  {/* Indicateur de chargement des frais */}
                  {feesLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
                    </div>
                  )}
                </div>

                {/* Net reçu — affiché UNIQUEMENT, pas les détails des frais */}
                {netAmount !== null && !feesLoading && montant >= 500 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2.5 rounded-xl bg-emerald-50 px-3.5 py-2.5 border border-emerald-100 flex items-center justify-between"
                  >
                    <span className="text-xs font-bold text-emerald-700">Net reçu sur Wave</span>
                    <span className="text-base font-extrabold text-emerald-700">{fcfa(netAmount)}</span>
                  </motion.div>
                )}

                {montant > max && (
                  <p className="mt-1.5 text-xs font-semibold text-rose-600">
                    Montant supérieur au solde disponible ({fcfa(max)})
                  </p>
                )}
              </div>

              {/* Erreur */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-3 flex items-start gap-2.5"
                >
                  <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-rose-700">{error}</p>
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button onClick={onClose} className="btn-ghost flex-1 !py-3">
                  Annuler
                </button>
                <button
                  onClick={() => setStep("confirm")}
                  disabled={!canSubmit}
                  className="btn-primary flex-1 !py-3"
                >
                  Continuer
                </button>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 2 : Confirmation inratable (TÂCHE 4) ── */}
          {step === "confirm" && (
            <div className="space-y-4 pt-4">
              {/* Bloc financier proéminent */}
              <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-5 text-white shadow-xl">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Vérifiez avant de confirmer</p>

                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-300">Vous demandez</span>
                  <span className="text-lg font-extrabold">{fcfa(montant)}</span>
                </div>

                {feeData && (
                  <>
                    <div className="flex justify-between items-center mb-2 group relative">
                      <span className="text-sm text-slate-400 flex items-center gap-1.5 cursor-help">
                        Frais totaux
                        <span className="grid h-4 w-4 place-items-center rounded-full bg-slate-700 text-[9px] font-bold text-slate-400">?</span>
                        <span className="absolute left-0 bottom-full mb-1 hidden group-hover:block w-56 rounded-xl bg-slate-700 px-3 py-2 text-[10px] text-slate-200 shadow-xl z-10 leading-relaxed">
                          Frais opérateur (1.5%) + commission plateforme (0.5%) appliqués automatiquement par le réseau de transfert.
                        </span>
                      </span>
                      <span className="text-sm font-bold text-rose-400">- {fcfa(feeData.gateway_fees + feeData.platform_commission)}</span>
                    </div>

                    <div className="h-px bg-slate-700 my-3" />

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-emerald-300">Montant final reçu sur Wave</span>
                      <span className="text-2xl font-extrabold text-emerald-400">{fcfa(feeData.net_amount)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Destinataire */}
              <div className="rounded-2xl bg-wave-50 p-4 border border-wave-100 space-y-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">Destinataire du transfert</p>
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-600 text-sm font-bold">{(name || "?")[0]}</span>
                  <div>
                    <p className="text-sm font-bold text-wave-900">{name}</p>
                    <p className="text-xs font-mono text-wave-500">{phone}</p>
                  </div>
                </div>
              </div>

              {/* Microcopy pédagogique */}
              <div className="rounded-xl bg-amber-50 border border-amber-100 px-3.5 py-2.5 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  <strong>Action irréversible.</strong> Le montant sera envoyé instantanément. Vérifiez bien le numéro Wave et le nom du destinataire avant de confirmer.
                </p>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-3 flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <div><p className="text-sm font-bold text-rose-700">Erreur</p><p className="text-xs text-rose-600 mt-0.5">{error}</p></div>
                </motion.div>
              )}

              <div className="flex gap-2 pt-1">
                <button onClick={() => setStep("form")} className="btn-ghost flex-1 !py-3">← Modifier</button>
                <button onClick={submitPayout} className="btn-primary flex-1 !py-3 !bg-emerald-600 hover:!bg-emerald-700">
                  ✓ Confirmer le retrait
                </button>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 3 : Loading ── */}
          {step === "loading" && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="h-16 w-16 rounded-full border-4 border-brand-100 border-t-brand-500 animate-spin" />
                <Send className="absolute inset-0 m-auto h-6 w-6 text-brand-500" />
              </div>
              <p className="mt-5 text-sm font-bold text-wave-600">Transfert en cours vers Wave…</p>
              <p className="mt-1 text-xs text-wave-400">Veuillez patienter, ne fermez pas cette fenêtre.</p>
            </div>
          )}

          {/* ── ÉTAPE 4 : Résultat avec suivi (TÂCHE 4) ── */}
          {step === "result" && result && (
            <div className="flex flex-col items-center justify-center py-8">
              {isSuccess ? (
                <>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12, stiffness: 200 }} className="grid h-20 w-20 place-items-center rounded-full bg-emerald-50 text-emerald-600 mb-4">
                    <CheckCircle2 className="h-10 w-10" />
                  </motion.div>
                  <p className="text-lg font-extrabold text-wave-900">{result.message}</p>
                  {result.payout && (
                    <div className="mt-4 w-full rounded-2xl bg-emerald-50 p-4 border border-emerald-100 space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-emerald-700">Net envoyé</span><span className="font-extrabold text-emerald-800">{fcfa(result.payout.net_amount)}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-emerald-700">Destinataire</span><span className="font-bold text-emerald-800">{result.payout.recipient_phone}</span></div>
                      {result.payout.provider_reference && (
                        <div className="flex justify-between text-sm"><span className="text-emerald-700">Référence</span><span className="font-mono text-xs text-emerald-800">{result.payout.provider_reference}</span></div>
                      )}
                      <div className="flex justify-between text-sm"><span className="text-emerald-700">Statut</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" />{result.payout.status === "pending" ? "En traitement" : "Payé"}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12, stiffness: 200 }} className="grid h-20 w-20 place-items-center rounded-full bg-rose-50 text-rose-600 mb-4">
                    <AlertTriangle className="h-10 w-10" />
                  </motion.div>
                  <p className="text-lg font-extrabold text-wave-900">Retrait échoué</p>
                  <div className="mt-3 w-full rounded-2xl bg-rose-50 p-4 border border-rose-200">
                    <p className="text-sm text-rose-700">{result.message}</p>
                    {result.failure_code && (
                      <p className="text-[10px] text-rose-400 mt-2 font-mono">Code : {result.failure_code}</p>
                    )}
                    <p className="text-[11px] text-rose-500 mt-2 leading-relaxed">
                      {result.failure_code === "RECIPIENT_LIMIT_EXCEEDED"
                        ? "Le compte Wave du destinataire a atteint son plafond. Demandez-lui de contacter Wave."
                        : result.failure_code === "INVALID_PHONE_FORMAT"
                        ? "Vérifiez que le numéro est bien au format international (+225...)."
                        : result.failure_code === "INSUFFICIENT_MERCHANT_BALANCE"
                        ? "Notre service est temporairement limité. Réessayez dans quelques minutes."
                        : "Votre solde n'a pas été débité. Vous pouvez réessayer en toute sécurité."}
                    </p>
                  </div>
                </>
              )}
              <button onClick={onClose} className="btn-primary mt-6 !py-3 w-full">Fermer</button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
