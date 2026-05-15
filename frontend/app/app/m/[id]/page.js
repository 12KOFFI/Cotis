"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Wallet, Clock, CheckCircle2, AlertTriangle, History, CreditCard, Upload, ImageUp, Phone, X } from "lucide-react";
import AppShell from "../../../components/AppShell";
import { api, fcfa, API_BASE } from "../../../lib/api";

const fmtDate = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "";

const STATUT = {
  a_jour: { t: "À jour", c: "bg-brand-50 text-brand-600", Icon: CheckCircle2 },
  partiel: { t: "Partiel", c: "bg-amber-50 text-amber-700", Icon: Clock },
  en_retard: { t: "En retard", c: "bg-red-50 text-red-700", Icon: AlertTriangle },
};

export default function MemberDashboard() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [validationJustDone, setValidationJustDone] = useState(false);
  const [validationMontant, setValidationMontant] = useState(null);

  async function loadDashboard() {
    const r = await api.get(`/groupes/${id}/mon-dashboard`);
    const d = r.data;
    setData(d);

    const storageKey = `demande_pending_${id}`;
    const raw = localStorage.getItem(storageKey);

    if (d.demande_en_attente) {
      localStorage.setItem(storageKey, JSON.stringify({
        montant: d.demande_en_attente.montant,
        date: d.demande_en_attente.date_paiement,
      }));
    } else if (raw) {
      try {
        const info = JSON.parse(raw);
        setValidationMontant(info.montant);
        setValidationJustDone(true);
        setTimeout(() => setValidationJustDone(false), 8000);
      } catch {}
      localStorage.removeItem(storageKey);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadDashboard();
  }, [id]);

  if (loading) return (
    <AppShell title="..." role="membre" groupeId={id}>
      <div className="space-y-3">
        <div className="h-48 animate-pulse rounded-3xl bg-wave-100/60"/>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-20 animate-pulse rounded-2xl bg-wave-100/60"/>
          <div className="h-20 animate-pulse rounded-2xl bg-wave-100/60"/>
        </div>
      </div>
    </AppShell>
  );

  const s = STATUT[data.statut] || STATUT.a_jour;
  const pct = data.montant_du > 0 ? Math.min(100, Math.round((data.montant_verse/data.montant_du)*100)) : 100;

  return (
    <AppShell title={data.groupe.nom} role="membre" groupeId={id}>
      <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="overflow-hidden rounded-3xl wave-bg text-white shadow-soft">
        <div className="p-5 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/60">Ma cotisation</p>
              <p className="mt-0.5 text-sm font-medium text-white/80">
                {data.periode ? `${fmtDate(data.periode.date_debut)} → ${fmtDate(data.periode.date_fin)}` : "Aucune période active"}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
              <s.Icon className="h-3.5 w-3.5"/> {s.t}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
              <p className="text-[10px] font-semibold text-white/60">Déjà payé</p>
              <p className="mt-0.5 font-display text-xl font-extrabold text-white">{fcfa(data.montant_verse)}</p>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-300">
                <CheckCircle2 className="h-3 w-3" /> <span>Versé</span>
              </div>
            </div>
            <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
              <p className="text-[10px] font-semibold text-white/60">Reste à payer</p>
              <p className="mt-0.5 font-display text-xl font-extrabold text-white">{fcfa(data.reste_a_payer)}</p>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-300">
                <Clock className="h-3 w-3" /> <span>{data.reste_a_payer > 0 ? "En attente" : "À jour"}</span>
              </div>
            </div>
          </div>

          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
              <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.8}} className="h-full rounded-full bg-white"/>
            </div>
            <p className="mt-1 text-[11px] text-white/50">{fcfa(data.montant_verse)} versés sur {fcfa(data.montant_du)}</p>
          </div>
        </div>
        {data.reste_a_payer > 0 && (
          <div className="flex gap-2 border-t border-white/10 p-4">
            <button onClick={() => setConfirmOpen(true)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm font-bold text-wave-800 transition hover:bg-wave-50">
              <Wallet className="h-4 w-4"/> Confirmer le paiement
            </button>
            <Link href={`/app/m/${id}/paiements`} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/15 px-3 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/25">
              <History className="h-4 w-4"/> Historique
            </Link>
          </div>
        )}
      </motion.div>

      {validationJustDone && (
        <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} className="mt-3 rounded-2xl bg-emerald-50 p-4 border border-emerald-200">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-5 w-5"/></span>
            <div>
              <p className="text-sm font-bold text-emerald-800">Paiement validé !</p>
              <p className="text-xs text-emerald-600">
                {validationMontant ? fcfa(validationMontant) : ''} Confirmé par le gestionnaire.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {data.adhesion && data.adhesion.statut !== "paye" && (
        <motion.div initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} transition={{delay:0.15}} className="mt-3 flex items-start gap-3 rounded-2xl bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500"/>
          <div>
            <p className="text-sm font-semibold text-red-700">Droit d'adhésion en attente</p>
            <p className="mt-0.5 text-xs text-red-600">Reste : <strong>{fcfa(data.adhesion.montant_du - data.adhesion.montant_paye)}</strong>. Vous ne pourrez pas payer de cotisation tant que l'adhésion n'est pas réglée.</p>
          </div>
        </motion.div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Link href={`/app/m/${id}/carte`} className="card flex flex-col items-center gap-2 py-5 text-center transition hover:-translate-y-0.5">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-wave-50 text-wave-700"><CreditCard className="h-5 w-5"/></span>
          <div>
            <p className="text-sm font-bold">Ma carte</p>
            <p className="text-[10px] text-wave-500">QR code</p>
          </div>
        </Link>
        <Link href={`/app/m/${id}/paiements`} className="card flex flex-col items-center gap-2 py-5 text-center transition hover:-translate-y-0.5">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-wave-50 text-wave-700"><History className="h-5 w-5"/></span>
          <div>
            <p className="text-sm font-bold">Paiements</p>
            <p className="text-[10px] text-wave-500">Historique</p>
          </div>
        </Link>
      </div>

      {data.demande_en_attente && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="mt-3 rounded-2xl bg-amber-50 p-3 border border-amber-200">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-600"><Clock className="h-4 w-4"/></span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-amber-800">En attente</p>
              <p className="text-[11px] text-amber-600 truncate">{fcfa(data.demande_en_attente.montant)} soumis le {fmtDate(data.demande_en_attente.date_paiement)}</p>
            </div>
            <span className="text-[10px] font-semibold text-amber-500 whitespace-nowrap">Validation...</span>
          </div>
        </motion.div>
      )}

      {confirmOpen && <ConfirmPayModal groupeId={id} groupe={data.groupe} montant={data.reste_a_payer} onClose={() => { setConfirmOpen(false); loadDashboard(); }} />}
    </AppShell>
  );
}

const OPERATEURS = [
  { id: "orange_money", nom: "Orange Money", bg: "bg-orange-50", border: "border-orange-300", circle: "bg-orange-500", activeBg: "bg-orange-100" },
  { id: "wave", nom: "Wave", bg: "bg-teal-50", border: "border-teal-300", circle: "bg-teal-500", activeBg: "bg-teal-100" },
  { id: "moov", nom: "Moov Money", bg: "bg-red-50", border: "border-red-300", circle: "bg-red-500", activeBg: "bg-red-100" },
  { id: "mtn", nom: "MTN Mobile Money", bg: "bg-yellow-50", border: "border-yellow-300", circle: "bg-yellow-500", activeBg: "bg-yellow-100" },
];

function ConfirmPayModal({ groupeId, groupe, montant, onClose }) {
  const [amount, setAmount] = useState(montant);
  const [mode, setMode] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!["image/jpeg","image/png","image/webp"].includes(f.type)) {
      setError("Format accepté : JPEG, PNG ou WebP uniquement.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("L'image ne doit pas dépasser 5 Mo.");
      return;
    }
    setFile(f);
    setError("");
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(f);
  }

  async function submit() {
    if (!amount || amount < 1) { setError("Veuillez saisir le montant payé."); return; }
    if (!mode) { setError("Veuillez sélectionner le service de paiement utilisé."); return; }
    if (!file) { setError("Veuillez importer une capture du reçu de paiement."); return; }
    setError(""); setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("montant", parseInt(amount));
      fd.append("mode", mode);
      fd.append("preuve", file);
      await api.post(`/groupes/${groupeId}/paiements/demande`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(true);
      setTimeout(() => onClose(), 2000);
    } catch (e) {
      setError(e.response?.data?.message || "Erreur lors de l'envoi de la demande.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-wave-900/40 backdrop-blur-sm sm:place-items-center" onClick={onClose}>
      <motion.div
        initial={{y:60,opacity:0}}
        animate={{y:0,opacity:1}}
        transition={{type:"spring",damping:25,stiffness:300}}
        onClick={(e)=>e.stopPropagation()}
        className="flex flex-col w-full max-w-md rounded-t-3xl bg-white shadow-soft sm:rounded-3xl max-h-[90vh]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-wave-100 px-5 py-4">
          <h3 className="font-display text-lg font-extrabold">Confirmer un paiement</h3>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-wave-100 text-wave-500 transition hover:bg-wave-50 hover:text-wave-700">
            <X className="h-4 w-4"/>
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-5">
          {success ? (
            <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} className="flex flex-col items-center gap-3 py-6">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600"><CheckCircle2 className="h-7 w-7"/></span>
              <p className="font-display text-lg font-bold">Demande envoyée</p>
              <p className="text-sm text-wave-500 text-center">Le gestionnaire vérifiera votre paiement sous peu.</p>
            </motion.div>
          ) : (
            <div className="space-y-4 pt-3">
              {groupe.wave_numero && (
                <div className="rounded-2xl bg-brand-50 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-600">Numéro du gestionnaire</p>
                  <div className="mt-1.5 flex items-center gap-2 text-lg font-extrabold text-brand-800">
                    <Phone className="h-5 w-5" /> {groupe.wave_numero}
                  </div>
                  <p className="mt-2 text-xs text-brand-600">Effectuez votre paiement via Mobile Money ou Wave, puis confirmez ci-dessous.</p>
                </div>
              )}

              <div>
                <label className="label">Montant payé</label>
                <input type="number" min="1" className="input text-lg font-bold" value={amount} onChange={(e) => setAmount(parseInt(e.target.value) || 0)} />
              </div>

              <div>
                <label className="label">Service de paiement utilisé</label>
                <p className="mb-2 text-xs text-wave-500">Sélectionnez le service avec lequel vous avez effectué le paiement.</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {OPERATEURS.map((o) => (
                    <button key={o.id} type="button" onClick={() => setMode(o.id)}
                      className={`relative flex flex-col items-center gap-2 rounded-2xl border-2 p-3.5 transition ${
                        mode === o.id
                          ? `${o.border} ${o.activeBg} shadow-sm`
                          : "border-wave-200 bg-wave-50/50 hover:border-wave-300"
                      }`}
                    >
                      <span className={`grid h-9 w-9 place-items-center rounded-full ${o.circle} text-white text-xs font-black shadow-sm`}>
                        {o.nom === "Orange Money" ? "OM" : o.nom === "Wave" ? "WV" : o.nom === "Moov Money" ? "MV" : "MTN"}
                      </span>
                      <span className={`text-[11px] font-bold text-center leading-tight ${mode === o.id ? "text-wave-900" : "text-wave-600"}`}>{o.nom}</span>
                      {mode === o.id && (
                        <span className="absolute top-2 right-2 grid h-5 w-5 place-items-center rounded-full bg-wave-900 text-white">
                          <CheckCircle2 className="h-3 w-3" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Preuve de paiement</label>
                <p className="mb-2 text-xs text-wave-500">
                  Veuillez importer une capture du reçu ou du SMS de confirmation de votre paiement afin que le gestionnaire puisse le vérifier.
                </p>
                {preview ? (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-brand-200">
                    <img src={preview} alt="Aperçu reçu" className="w-full h-48 object-cover" />
                    <button onClick={() => { setFile(null); setPreview(null); }} className="absolute top-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()} className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-wave-200 p-6 transition hover:border-brand-300 hover:bg-brand-50/50">
                    <ImageUp className="h-8 w-8 text-wave-400" />
                    <span className="text-sm font-semibold text-wave-600">Importer le reçu</span>
                    <span className="text-[10px] text-wave-400">JPEG, PNG ou WebP (max 5 Mo)</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
              </div>

              {error && (
                <motion.p initial={{opacity:0,y:-5}} animate={{opacity:1,y:0}} className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</motion.p>
              )}

              <button onClick={submit} disabled={submitting || !amount || !mode || !file} className="btn-primary w-full !py-3 text-base">
                {submitting ? "Envoi en cours..." : "Envoyer la demande"}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
