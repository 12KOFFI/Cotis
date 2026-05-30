"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Wallet, Clock, CheckCircle2, AlertTriangle, History, CreditCard, X } from "lucide-react";
import AppShell from "../../../components/AppShell";
import { api, fcfa } from "../../../lib/api";
import { fmtDate } from "../../../lib/utils";

const STATUT = {
  a_jour: { t: "À jour", c: "bg-emerald-50 text-emerald-600 border border-emerald-100", Icon: CheckCircle2 },
  partiel: { t: "Paiement partiel", c: "bg-sky-50 text-sky-700 border border-sky-100", Icon: Clock },
  en_attente: { t: "En attente de paiement", c: "bg-amber-50 text-amber-700 border border-amber-100", Icon: Clock },
  en_retard: { t: "En retard", c: "bg-orange-50 text-orange-700 border border-orange-100", Icon: AlertTriangle },
  impaye: { t: "Impayé", c: "bg-rose-50 text-rose-700 border border-rose-100", Icon: AlertTriangle },
};

export default function MemberDashboard() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function loadDashboard() {
    try {
      setError(null);
      const response = await api.get(`/groupes/${id}/mon-dashboard`);
      setData(response.data);
    } catch (err) {
      setError("Impossible de charger vos données. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!id || id === 'undefined') return;
    loadDashboard(); /* eslint-disable-next-line */
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

  if (error) return (
    <AppShell title="Erreur" role="membre" groupeId={id}>
      <div className="rounded-3xl bg-rose-50 py-12 text-center border-2 border-dashed border-rose-200">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-white text-rose-400 shadow-sm">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium text-rose-600 mb-4">{error}</p>
        <button onClick={() => { setLoading(true); loadDashboard(); }} className="btn-primary">
          Réessayer
        </button>
      </div>
    </AppShell>
  );

  const statutInfo = STATUT[data.statut] || STATUT.a_jour;
  const progressPct = data.montant_du > 0 ? Math.min(100, Math.round((data.montant_verse/data.montant_du)*100)) : 100;

  const needsAdhesion = data.adhesion && data.adhesion.statut !== "paye";
  const adhesionReste = needsAdhesion ? (data.adhesion.montant_du - data.adhesion.montant_paye) : 0;

  return (
    <AppShell title={data.groupe.nom} role="membre" groupeId={id}>
      {/* Adhesion block - shown FIRST and PROMINENTLY when adhesion is unpaid */}
      {needsAdhesion && (
        <motion.div initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} className="mb-4 rounded-2xl bg-red-50 p-4 border border-red-200 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-red-500"/>
            <div className="flex-1">
              <p className="text-sm font-bold text-red-700">Frais d'adhésion obligatoires</p>
              <p className="mt-1 text-xs text-red-600">
                Avant de pouvoir effectuer des cotisations, vous devez régler vos frais d'adhésion au groupe.
              </p>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-white p-3 border border-red-100">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">Montant dû</p>
                  <p className="font-display text-xl font-extrabold text-red-700">{fcfa(adhesionReste)}</p>
                </div>
                <button onClick={() => setConfirmOpen(true)} className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-600 shadow-sm">
                  Payer
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* En-tête groupe */}
      <div className="mb-4 flex items-center gap-3 px-1">
        {data.groupe?.logo ? (
          <img src={data.groupe.logo} alt={data.groupe.nom} className="h-10 w-10 rounded-2xl object-cover border border-wave-100" />
        ) : (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl wave-bg text-sm font-bold text-white shadow-soft">{data.groupe?.nom?.[0]}</span>
        )}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-wave-400">Espace Membre</p>
          <h2 className="font-display text-base font-extrabold text-wave-950 leading-tight">{data.groupe?.nom}</h2>
        </div>
      </div>

      {/* CARTE DE SOLDE / COTISATION */}
      <motion.div initial={{opacity:0, scale:0.97}} animate={{opacity:1, scale:1}} className="relative mb-6 overflow-hidden rounded-[2rem] bg-brand-600 p-6 text-white shadow-xl shadow-brand-500/20">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-brand-400/20 blur-2xl"></div>

        <div className="relative flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-100/70">Ma cotisation</p>
            <p className="text-xs font-semibold text-white/90 mt-0.5">
              {data.periode ? `${fmtDate(data.periode.date_debut)} → ${fmtDate(data.periode.date_fin)}` : "Aucune période active"}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black border ${statutInfo.c.includes('emerald') ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white/15 text-white border-white/20'} backdrop-blur-md`}>
            <statutInfo.Icon className="h-3 w-3" /> {statutInfo.t}
          </span>
        </div>

        <div className="relative text-center my-6">
          <p className="text-xs font-semibold text-brand-100/80 mb-0.5">Reste à payer</p>
          <div className="flex items-center justify-center gap-1">
            <span className="text-[2.5rem] font-display font-extrabold tracking-tight">{fcfa(data.reste_a_payer).replace(' FCFA', '')}</span>
            <span className="text-lg font-bold text-brand-200 mt-2.5">F</span>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="relative mt-5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full bg-white" />
          </div>
          <div className="flex justify-between items-center mt-2 text-[10px] font-bold text-brand-100/70">
            <span>{progressPct}% collectés</span>
            <span>Déjà payé : {fcfa(data.montant_verse)}</span>
          </div>
        </div>

        {/* Boutons d'action sur la carte */}
        {!needsAdhesion && data.reste_a_payer > 0 && (
          <div className="relative mt-6 flex gap-3">
            <button onClick={() => setConfirmOpen(true)} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-extrabold text-brand-600 shadow-sm transition-transform active:scale-95">
              <Wallet className="h-5 w-5"/> Payer maintenant
            </button>
          </div>
        )}

        {needsAdhesion && (
          <div className="relative mt-6 border-t border-white/10 pt-4">
            <p className="text-center text-xs font-bold text-brand-200/90">Cotisation bloquée · réglez l'adhésion</p>
          </div>
        )}
      </motion.div>

      {/* GRILLE D'ACTIONS MEMBRE */}
      <div className="mt-5 grid grid-cols-2 gap-3.5">
        <Link href={data?.membre?.role === "gestionnaire" ? "/app/portail" : `/app/m/${id}/carte`} className="bg-white rounded-2xl p-5 shadow-sm border border-wave-100 flex flex-col items-center text-center gap-2.5 active:scale-95 transition-transform">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><CreditCard className="h-6 w-6"/></span>
          <div>
            <p className="text-sm font-bold text-wave-900">Ma carte</p>
            <p className="text-[10px] font-semibold text-wave-400 mt-0.5">Voir le QR code</p>
          </div>
        </Link>
        <Link href={`/app/m/${id}/paiements`} className="bg-white rounded-2xl p-5 shadow-sm border border-wave-100 flex flex-col items-center text-center gap-2.5 active:scale-95 transition-transform">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><History className="h-6 w-6"/></span>
          <div>
            <p className="text-sm font-bold text-wave-900">Paiements</p>
            <p className="text-[10px] font-semibold text-wave-400 mt-0.5">Historique complet</p>
          </div>
        </Link>
      </div>

      {confirmOpen && <ConfirmPayModal groupeId={id} groupe={data.groupe} montant={data.reste_a_payer} adhesion={data.adhesion} onClose={() => { setConfirmOpen(false); loadDashboard(); }} />}
    </AppShell>
  );
}

function ConfirmPayModal({ groupeId, groupe, montant, adhesion, onClose }) {
  const needsAdhesion = adhesion && adhesion.statut !== "paye";
  const calcEnvoye = (M) => Math.ceil((M * 1.01 + 100) / 0.975);
  const calcRecoit = (X) => Math.floor((X * 0.975 - 100) / 1.01);

  const defaultReceived = needsAdhesion ? (adhesion.montant_du - adhesion.montant_paye) : montant;
  
  const [amountReceived, setAmountReceived] = useState(defaultReceived || "");
  const [amountSent, setAmountSent] = useState(defaultReceived ? calcEnvoye(defaultReceived) : "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleReceivedChange = (val) => {
    const received = parseInt(val);
    if (!isNaN(received)) {
      setAmountReceived(received);
      setAmountSent(calcEnvoye(received));
    } else {
      setAmountReceived("");
      setAmountSent("");
    }
  };

  const handleSentChange = (val) => {
    const sent = parseInt(val);
    if (!isNaN(sent)) {
      setAmountSent(sent);
      const received = Math.max(0, calcRecoit(sent));
      setAmountReceived(received);
    } else {
      setAmountSent("");
      setAmountReceived("");
    }
  };

  async function submit() {
    if (!amountSent || amountSent < 1 || !amountReceived || amountReceived < 1) { 
      setError("Montant invalide."); 
      return; 
    }
    setError(""); setSubmitting(true);
    let isRedirecting = false;
    try {
      const response = await api.post(`/groupes/${groupeId}/paiements/initier`, {
        montant: amountReceived, // On envoie le montant que le bénéficiaire doit recevoir
        montant_envoye: amountSent, // On envoie aussi le montant total facturé au client
        type: needsAdhesion ? "adhesion" : "cotisation",
      });
      if (response.data.checkout_url) {
        // Sauvegarder le groupe pour la redirection après paiement
        localStorage.setItem('cp_last_groupe', groupeId);
        isRedirecting = true;
        window.location.href = response.data.checkout_url;
      } else {
        setError("Lien de paiement Wave indisponible.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d'initier le paiement Wave.");
    } finally {
      if (!isRedirecting) {
        setSubmitting(false);
      }
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
          <h3 className="font-display text-lg font-extrabold">Payer avec Wave</h3>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-wave-100 text-wave-500 transition hover:bg-wave-50 hover:text-wave-700">
            <X className="h-4 w-4"/>
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-5">
          <div className="space-y-4 pt-3">
              <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100 flex items-start gap-2.5">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5"/>
                <div>
                  <p className="text-xs font-bold text-emerald-800">Paiement 100% sécurisé</p>
                  <p className="mt-0.5 text-xs text-emerald-700">Vous allez être redirigé vers l'espace Wave pour valider votre transaction en toute sécurité.</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {needsAdhesion && (
                  <p className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-100">
                    Paiement obligatoire des frais d'adhésion ({fcfa(adhesion.montant_du - adhesion.montant_paye)}). Vous devez d'abord régler l'adhésion avant de payer les cotisations.
                  </p>
                )}
                
                <div>
                  <label className="label mb-1.5 inline-block text-xs font-bold text-wave-500 uppercase tracking-wide">J'envoie</label>
                  <div className="relative">
                    <input type="number" min="1" className="input text-lg font-bold w-full pr-16" placeholder="Ex: 5275" value={amountSent} onChange={(e) => handleSentChange(e.target.value)} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-extrabold text-wave-400">FCFA</span>
                  </div>
                </div>
                
                <div className="relative py-2 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-dashed border-wave-200"></div></div>
                  <div className="relative bg-white px-3 text-[10px] font-bold uppercase tracking-widest text-wave-400">Converti automatiquement</div>
                </div>

                <div>
                  <label className="label mb-1.5 inline-block text-xs font-bold text-wave-500 uppercase tracking-wide">Le bénéficiaire reçoit</label>
                  <div className="relative">
                    <input type="number" min="1" className="input text-lg font-bold w-full pr-16 bg-wave-50/50" placeholder="Ex: 5000" value={amountReceived} onChange={(e) => handleReceivedChange(e.target.value)} />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-extrabold text-wave-400">FCFA</span>
                  </div>
                </div>
              </div>

              {error && (
                <motion.p initial={{opacity:0,y:-5}} animate={{opacity:1,y:0}} className="rounded-xl bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</motion.p>
              )}

              <button onClick={submit} disabled={submitting || !amountSent || !amountReceived} className="btn-primary w-full !py-3.5 text-base mt-2 shadow-md shadow-brand-500/20">
                {submitting ? "Redirection en cours..." : `Payer ${amountSent ? fcfa(amountSent) : ''}`}
              </button>
            </div>
        </div>
      </motion.div>
    </div>
  );
}
