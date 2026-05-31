"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  X,
  Calendar,
  Upload,
  FileText,
  ArrowUpRight,
  CreditCard,
  History,
  UserPlus,
  Link2,
  Settings,
  Download,
  FileDown,
  Check,
  Copy,
  Share2,
  Edit3,
  XCircle,
  Ban,
} from "lucide-react";
import PhoneInput from "../../../components/PhoneInput";
import AppShell from "../../../components/AppShell";
import { api, fcfa, auth, API_BASE } from "../../../lib/api";
import { fmtDate, fmtTime } from "../../../lib/utils";

const STATUT_COLORS = {
  a_jour: "bg-brand-50 text-brand-600",
  en_attente: "bg-amber-50 text-amber-700",
  en_retard: "bg-orange-50 text-orange-700",
  impaye: "bg-red-50 text-red-700",
};

const TX_STATUS_CFG = {
  reussi: {
    Icon: CheckCircle2,
    cls: "bg-emerald-50 text-emerald-600 border border-emerald-100",
    textCls: "text-emerald-600",
    label: "Réussi",
  },
  en_attente: {
    Icon: Clock,
    cls: "bg-amber-50 text-amber-600 border border-amber-100",
    textCls: "text-amber-600",
    label: "En attente",
  },
  echoue: {
    Icon: XCircle,
    cls: "bg-rose-50 text-rose-600 border border-rose-100",
    textCls: "text-rose-600 line-through opacity-70",
    label: "Échoué",
  },
  annule: {
    Icon: Ban,
    cls: "bg-slate-50 text-slate-500 border border-slate-200",
    textCls: "text-slate-400 line-through opacity-60",
    label: "Annulé",
  },
};

export default function GestionnaireDashboard() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [groupe, setGroupe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payOpen, setPayOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [addMembreOpen, setAddMembreOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  async function loadDashboard() {
    const [dash, grp] = await Promise.all([
      api.get(`/groupes/${id}/dashboard`),
      api.get(`/groupes/${id}`),
    ]);
    setData(dash.data);
    setGroupe(grp.data.groupe);
    setLoading(false);
  }

  useEffect(() => {
    if (!id || id === "undefined") return;
    loadDashboard();
  }, [id]);

  if (loading)
    return (
      <AppShell title="..." groupeId={id}>
        <div className="space-y-3">
          <div className="h-36 animate-pulse rounded-3xl bg-wave-100/60" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-24 animate-pulse rounded-2xl bg-wave-100/60" />
            <div className="h-24 animate-pulse rounded-2xl bg-wave-100/60" />
          </div>
          <div className="h-48 animate-pulse rounded-2xl bg-wave-100/60" />
        </div>
      </AppShell>
    );

  const pct =
    data.total_attendu > 0
      ? Math.min(100, Math.round((data.total_recu / data.total_attendu) * 100))
      : 0;

  return (
    <AppShell title={groupe?.nom || "Tableau de bord"} groupeId={id}>
      {/* HEADER PROFIL SIMPLE */}
      <div className="mb-6 flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          {groupe?.logo ? (
            <img src={groupe.logo} alt={groupe.nom} className="h-12 w-12 rounded-full object-cover shadow-sm ring-2 ring-white" />
          ) : (
            <div className="grid h-12 w-12 place-items-center rounded-full bg-wave-100 text-wave-600 text-xl font-black ring-2 ring-white shadow-sm">
              {groupe?.nom?.[0]}
            </div>
          )}
          <div>
            <h1 className="font-display text-lg font-black text-wave-900 leading-tight">{groupe?.nom}</h1>
            <p className="text-[11px] font-bold text-wave-500 uppercase tracking-wider">Gestionnaire</p>
          </div>
        </div>
        <button onClick={() => setSettingsOpen(true)} className="grid h-10 w-10 place-items-center rounded-full bg-white text-wave-600 shadow-sm border border-wave-100 transition active:scale-95">
          <Settings className="h-5 w-5" />
        </button>
      </div>

      {/* CARTE DE SOLDE PRINCIPALE (STYLE WAVE DEEP BLUE) */}
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="relative mb-6 overflow-hidden rounded-[2rem] wave-bg p-6 text-white shadow-xl shadow-wave-500/20">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/5 blur-2xl"></div>
        
        <div className="relative">
          <p className="text-xs font-semibold text-wave-100 uppercase tracking-widest mb-1 text-center">Argent en Caisse</p>
          <div className="flex items-center justify-center gap-1">
            <span className="text-[2.75rem] font-display font-black tracking-tight">{fcfa(data.solde_caisse).replace(' FCFA', '')}</span>
            <span className="text-xl font-bold text-wave-200 mt-3">F</span>
          </div>
          
          <div className="mt-4 border-t border-white/10 pt-3 flex items-center justify-between text-xs">
            <div className="flex flex-col">
              <span className="text-white/60 text-[10px] font-bold uppercase">Disponible (Wave)</span>
              <span className="font-bold text-sm text-wave-100">{fcfa(data.solde_disponible)}</span>
            </div>
            <Link href={`/app/g/${id}/caisse`} className="flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1.5 font-bold backdrop-blur-md transition hover:bg-white/30 active:scale-95">
              Voir détails <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* PROGRESSION COLLECTE */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-wave-50 text-wave-600">
              <TrendingUp className="h-4 w-4" />
            </span>
            <p className="text-xs font-black text-wave-800 uppercase tracking-wide">Taux de Collecte</p>
          </div>
          <span className="text-sm font-black text-wave-900 bg-wave-50 px-2 py-0.5 rounded-lg">{data.taux_collecte}%</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-wave-100">
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full wave-bg" />
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[11px] font-bold text-wave-500">
          <span>Reçu: {fcfa(data.total_recu)}</span>
          <span>Attendu: {fcfa(data.total_attendu)}</span>
        </div>
      </motion.div>

      {/* TOUTES LES ACTIONS PRINCIPALES (GRID 3X2 COMPLET ET AMÉLIORÉ) */}
      <h2 className="text-xs font-black uppercase tracking-wider text-wave-400 mb-3 px-1">Actions rapides</h2>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-3 mb-6">
        <button onClick={() => setPayOpen(true)} className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-wave-100 shadow-sm active:scale-95 transition-transform group text-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-wave-100 text-wave-600 group-hover:bg-wave-200 transition-colors">
            <PlusCircle className="h-6 w-6" />
          </div>
          <span className="text-[11px] font-extrabold text-wave-800 leading-tight">Encaisser</span>
        </button>

        <button onClick={() => setAddMembreOpen(true)} className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-wave-100 shadow-sm active:scale-95 transition-transform group text-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200 transition-colors">
            <UserPlus className="h-6 w-6" />
          </div>
          <span className="text-[11px] font-extrabold text-wave-800 leading-tight">Ajouter</span>
        </button>

        <button onClick={() => setInviteOpen(true)} className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-wave-100 shadow-sm active:scale-95 transition-transform group text-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-purple-100 text-purple-600 group-hover:bg-purple-200 transition-colors">
            <Share2 className="h-6 w-6" />
          </div>
          <span className="text-[11px] font-extrabold text-wave-800 leading-tight">Inviter</span>
        </button>

        <button onClick={() => setSettingsOpen(true)} className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-wave-100 shadow-sm active:scale-95 transition-transform group text-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-100 text-amber-600 group-hover:bg-amber-200 transition-colors">
            <Settings className="h-6 w-6" />
          </div>
          <span className="text-[11px] font-extrabold text-wave-800 leading-tight">Tarifs</span>
        </button>

        <ExportButton groupeId={id} type="pdf" />
        <ExportButton groupeId={id} type="csv" />
      </motion.div>

      {/* STATUTS MEMBRES (CONSERVÉS MAIS ENTIÈREMENT SUBLIMÉS) */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-wave-800">Statut des membres</h3>
          <Link href={`/app/g/${id}/membres`} className="text-xs font-bold text-wave-600 bg-wave-50 px-2.5 py-1 rounded-full hover:bg-wave-100 transition-colors">
            Voir tous
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: "À jour", count: data.a_jour, cls: "bg-emerald-50 text-emerald-600 border border-emerald-100/50", Icon: CheckCircle2 },
            { label: "Attente", count: data.en_attente, cls: "bg-amber-50 text-amber-700 border border-amber-100/50", Icon: Clock },
            { label: "Retard", count: data.en_retard, cls: "bg-orange-50 text-orange-700 border border-orange-100/50", Icon: AlertTriangle },
            { label: "Impayé", count: data.impaye, cls: "bg-rose-50 text-rose-700 border border-rose-100/50", Icon: AlertTriangle },
          ].map(({ label, count, cls, Icon }) => (
            <div key={label} className={`rounded-2xl p-2 text-center flex flex-col justify-between items-center ${cls}`}>
              <Icon className="h-4 w-4 mb-1" />
              <p className="text-base font-black leading-none">{count}</p>
              <p className="text-[9px] font-bold mt-1 leading-none">{label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* PÉRIODE EN COURS */}
      {data.periode && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="card mb-6 overflow-hidden border border-wave-100">
          <div className="p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-wave-50 text-wave-600">
                <Calendar className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400">Période en cours</p>
                <p className="text-sm font-extrabold text-wave-800">{fmtDate(data.periode.date_debut)} → {fmtDate(data.periode.date_fin)}</p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-wave-600 bg-wave-50 px-2.5 py-1 rounded-lg">{groupe?.frequence}</span>
          </div>
          {data.date_debut_cotisations && (
            <div className="bg-wave-50/50 px-4 py-2 border-t border-wave-100/50 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-wave-400" />
              <p className="text-[11px] font-medium text-wave-600">
                Début des cotisations : <span className="font-bold text-wave-800">{fmtDate(data.date_debut_cotisations)}</span>
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* RACCOURCIS DE NAVIGATION PRINCIPAUX */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="grid grid-cols-2 gap-3 mb-6">
        <Link href={`/app/g/${id}/membres`} className="flex items-center gap-3.5 p-4 bg-white rounded-2xl border border-wave-100 shadow-sm active:scale-[0.98] transition-transform">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-black text-wave-900 leading-tight">Membres</p>
            <p className="text-[11px] font-bold text-wave-500">{data.nb_membres} au total</p>
          </div>
        </Link>
        <Link href={`/app/g/${id}/caisse`} className="flex items-center gap-3.5 p-4 bg-white rounded-2xl border border-wave-100 shadow-sm active:scale-[0.98] transition-transform">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
            <Wallet className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-black text-wave-900 leading-tight">Caisse</p>
            <p className="text-[11px] font-bold text-wave-500">{fcfa(data.solde_caisse)}</p>
          </div>
        </Link>
      </motion.div>

      {/* HISTORIQUE RÉCENT */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-wave-400">Activité récente</h3>
          {data.has_payments && (
            <Link href={`/app/g/${id}/caisse`} className="text-xs font-bold text-wave-600 hover:underline">
              Tout voir
            </Link>
          )}
        </div>
        
        {data.dernieres_transactions && data.dernieres_transactions.length > 0 ? (() => {
          // Grouper par date (style Wave)
          const sorted = [...data.dernieres_transactions].sort((a, b) => {
            const da = new Date(a.created_at || a.date_paiement);
            const db = new Date(b.created_at || b.date_paiement);
            return db - da;
          });
          const groups = [];
          let currentDate = null;
          let currentGroup = null;
          for (const tx of sorted) {
            const d = new Date(tx.created_at || tx.date_paiement);
            const dateKey = d.toISOString().slice(0, 10);
            if (dateKey !== currentDate) {
              currentDate = dateKey;
              currentGroup = { date: dateKey, transactions: [] };
              groups.push(currentGroup);
            }
            currentGroup.transactions.push(tx);
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
                  <div className="space-y-2.5">
                    {group.transactions.map((tx) => {
                      const cfg = TX_STATUS_CFG[tx.statut] || TX_STATUS_CFG.reussi;
                      const IconComp = cfg.Icon;
                      const heureStr = fmtTime(tx.created_at || tx.date_paiement);
                      return (
                        <div key={tx.id} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-wave-100 active:scale-[0.98] transition-transform">
                          <div className="flex items-center gap-3.5">
                            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${cfg.cls}`}>
                              <IconComp className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-wave-900">{tx.membre?.prenom} {tx.membre?.nom}</p>
                              <p className="text-[11px] font-medium text-wave-500 capitalize flex items-center gap-2 flex-wrap">
                                <span>{heureStr} • {tx.mode}</span>
                                {tx.statut !== "reussi" && (
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                    tx.statut === "en_attente" 
                                      ? "bg-amber-50 text-amber-600 border border-amber-100" 
                                      : tx.statut === "echoue" 
                                      ? "bg-rose-50 text-rose-600 border border-rose-100"
                                      : "bg-slate-100 text-slate-600 border border-slate-200"
                                  }`}>
                                    {cfg.label}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {tx.statut === "en_attente" && tx.transaction_id && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    const res = await api.post(`/groupes/${id}/paiements/${tx.id}/verifier`);
                                    alert(res.data.message || "Vérification effectuée.");
                                    loadDashboard();
                                  } catch (err) {
                                    alert(err.response?.data?.message || "Erreur lors de la vérification.");
                                  }
                                }}
                                className="rounded-xl bg-amber-50 border border-amber-200 px-2.5 py-1.5 text-[10px] font-bold text-amber-700 hover:bg-amber-100 transition whitespace-nowrap"
                              >
                                Vérifier
                              </button>
                            )}
                            <p className={`text-base font-extrabold ${cfg.textCls}`}>{fcfa(tx.montant).replace(' FCFA', '')}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        })() : (
          <div className="rounded-3xl bg-wave-50 py-10 text-center border-2 border-dashed border-wave-200">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-white text-wave-400 shadow-sm">
              <History className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-wave-500 mb-3">Aucun paiement enregistré.</p>
            <button onClick={() => setPayOpen(true)} className="btn-primary text-xs !py-2 !px-4">
              <PlusCircle className="h-4 w-4" /> Enregistrer un paiement
            </button>
          </div>
        )}
      </motion.div>

      {payOpen && (
        <EnregistrerPaiementModal
          groupeId={id}
          onClose={() => {
            setPayOpen(false);
            loadDashboard();
          }}
        />
      )}
      {inviteOpen && (
        <InviteLinkModal groupeId={id} groupe={groupe} onClose={() => setInviteOpen(false)} />
      )}
      {addMembreOpen && (
        <AddMembreModal
          groupeId={id}
          groupe={groupe}
          onClose={() => {
            setAddMembreOpen(false);
            loadDashboard();
          }}
        />
      )}
      {settingsOpen && (
        <SettingsTarifsModal
          groupeId={id}
          groupe={groupe}
          periode={data.periode}
          onClose={(updated) => {
            setSettingsOpen(false);
            if (updated) loadDashboard();
          }}
        />
      )}
    </AppShell>
  );
}

function EnregistrerPaiementModal({ groupeId, onClose }) {
  const [membres, setMembres] = useState([]);
  const [f, setF] = useState({
    membre_id: "",
    type: "cotisation",
    montant: "",
    mode: "cash",
    date_paiement: new Date().toISOString().slice(0, 10),
    note: "",
  });
  const [justificatif, setJustificatif] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMembres, setLoadingMembres] = useState(true);

  useEffect(() => {
    api.get(`/groupes/${groupeId}/membres`).then((r) => {
      setMembres(r.data.membres || []);
      setLoadingMembres(false);
    });
  }, [groupeId]);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setErr("Le fichier ne doit pas dépasser 5 Mo.");
      return;
    }
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    if (!allowed.includes(file.type)) {
      setErr("Format accepté : JPEG, PNG, WebP ou PDF.");
      return;
    }
    setJustificatif(file);
    setErr("");
    if (file.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  }

  function removeFile() {
    setJustificatif(null);
    setPreviewUrl(null);
  }

  async function submit() {
    if (!f.membre_id || !f.montant) {
      setErr("Veuillez remplir les champs obligatoires.");
      return;
    }
    setErr("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("membre_id", f.membre_id);
      formData.append("type", f.type);
      formData.append("montant", f.montant);
      formData.append("mode", f.mode);
      formData.append("date_paiement", f.date_paiement);
      if (f.note) formData.append("note", f.note);
      if (justificatif) formData.append("justificatif", justificatif);

      await api.post(`/groupes/${groupeId}/paiements`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onClose();
    } catch (e) {
      setErr(e.response?.data?.message || "Erreur lors de l'enregistrement.");
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
        className="flex flex-col w-full max-w-md rounded-t-3xl bg-white shadow-soft sm:rounded-3xl max-h-[90vh]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-wave-100 px-5 py-4">
          <h3 className="font-display text-lg font-extrabold">
            Enregistrer un paiement
          </h3>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-wave-100 text-wave-500 transition hover:bg-wave-50 hover:text-wave-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-5">
          <div className="space-y-3.5 pt-3">
            <div>
              <label className="label">Membre *</label>
              {loadingMembres ? (
                <div className="h-10 animate-pulse rounded-xl bg-wave-100/60" />
              ) : (
                <select
                  className="input"
                  value={f.membre_id}
                  onChange={(e) => setF({ ...f, membre_id: e.target.value })}
                >
                  <option value="">Sélectionner un membre</option>
                  {membres.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.prenom} {m.nom}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Type</label>
                <select
                  className="input"
                  value={f.type}
                  onChange={(e) => setF({ ...f, type: e.target.value })}
                >
                  <option value="cotisation">Cotisation</option>
                  <option value="adhesion">Adhésion</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div>
                <label className="label">Mode</label>
                <select
                  className="input"
                  value={f.mode}
                  onChange={(e) => setF({ ...f, mode: e.target.value })}
                >
                  <option value="cash">Cash</option>
                  <option value="wave">Wave</option>
                  <option value="virement">Virement</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Montant (FCFA) *</label>
                <input
                  type="number"
                  min="1"
                  className="input"
                  placeholder="0"
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
                <label className="label">Date</label>
                <input
                  type="date"
                  className="input"
                  value={f.date_paiement}
                  onChange={(e) =>
                    setF({ ...f, date_paiement: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="label">Note</label>
              <input
                className="input"
                placeholder="Optionnel"
                value={f.note}
                onChange={(e) => setF({ ...f, note: e.target.value })}
              />
            </div>

            {/* Justificatif upload */}
            <div>
              <label className="label">Justificatif (optionnel)</label>
              <p className="text-[10px] text-wave-500 mb-2">
                Image ou PDF — reçu, capture ou preuve de paiement (max 5 Mo)
              </p>
              {justificatif ? (
                <div className="rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50 p-3">
                  <div className="flex items-center gap-3">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Aperçu"
                        className="h-14 w-14 rounded-xl object-cover"
                      />
                    ) : (
                      <span className="grid h-14 w-14 place-items-center rounded-xl bg-white text-brand-600">
                        <FileText className="h-6 w-6" />
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-wave-800">
                        {justificatif.name}
                      </p>
                      <p className="text-[10px] text-wave-500">
                        {(justificatif.size / 1024).toFixed(0)} Ko
                      </p>
                    </div>
                    <button
                      onClick={removeFile}
                      className="grid h-8 w-8 place-items-center rounded-lg bg-red-50 text-red-500 transition hover:bg-red-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-wave-200 bg-wave-50 px-4 py-6 text-sm font-semibold text-wave-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700">
                  <Upload className="h-5 w-5" />
                  <span>Choisir un fichier</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={handleFile}
                  />
                </label>
              )}
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
                disabled={loading || !f.membre_id || !f.montant}
                className="btn-primary flex-1 !py-3"
              >
                {loading ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ExportButton({ groupeId, type }) {
  const [busy, setBusy] = useState(false);
  const isPdf = type === "pdf";

  async function doExport() {
    setBusy(true);
    try {
      const token = auth.getToken();
      const res = await fetch(
        `${API_BASE}/groupes/${groupeId}/export/${type}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = isPdf
        ? `rapport-${groupeId}.pdf`
        : `paiements-${groupeId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
    setBusy(false);
  }

  return (
    <button
      onClick={doExport}
      disabled={busy}
      className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl border border-wave-100 shadow-sm active:scale-95 transition-transform group text-center w-full disabled:opacity-50"
    >
      <div
        className={`grid h-12 w-12 place-items-center rounded-xl transition-colors ${isPdf ? "bg-red-50 text-red-600 group-hover:bg-red-100" : "bg-teal-50 text-teal-600 group-hover:bg-teal-100"}`}
      >
        {isPdf ? (
          <FileText className="h-6 w-6" />
        ) : (
          <FileDown className="h-6 w-6" />
        )}
      </div>
      <span className="text-[11px] font-extrabold text-wave-800 leading-tight">
        {isPdf ? "Rapport PDF" : "Rapport CSV"}
      </span>
    </button>
  );
}

function InviteLinkModal({ groupeId, groupe, onClose }) {
  const [tab, setTab] = useState("public"); // "public" | "perso"
  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Champs personnalisation
  const [targetNom, setTargetNom] = useState("");
  const [targetPrenom, setTargetPrenom] = useState("");
  const [montantPerso, setMontantPerso] = useState("");

  useEffect(() => {
    api
      .get(`/groupes/${groupeId}/invite-link`)
      .then((r) => {
        const l = r.data.link;
        setLink(l);
        // Basculer automatiquement sur l'onglet correspondant au lien actif
        if (l && (l.target_name || l.montant_perso)) setTab("perso");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [groupeId]);

  async function generatePublic() {
    setGenerating(true);
    try {
      const r = await api.post(`/groupes/${groupeId}/invite-link`, {
        expires_in_days: 30,
      });
      setLink(r.data.link);
    } catch {}
    setGenerating(false);
  }

  async function generatePerso() {
    setGenerating(true);
    try {
      const payload = { expires_in_days: 30 };
      if (targetNom.trim()) payload.target_name = targetNom.trim();
      if (targetPrenom.trim()) payload.target_prenom = targetPrenom.trim();
      if (montantPerso) payload.montant_perso = parseInt(montantPerso);
      const r = await api.post(`/groupes/${groupeId}/invite-link`, payload);
      setLink(r.data.link);
    } catch {}
    setGenerating(false);
  }

  async function deactivate() {
    if (!link?.id) return;
    try {
      await api.delete(`/groupes/${groupeId}/invite-link?link_id=${link.id}`);
      setLink(null);
    } catch {}
  }

  function resetForm() {
    setLink(null);
    setTargetNom("");
    setTargetPrenom("");
    setMontantPerso("");
  }

  function doCopy() {
    if (!link?.url) return;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(link.url)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => fallbackCopy(link.url));
    } else {
      fallbackCopy(link.url);
    }
  }

  function fallbackCopy(text) {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.focus();
    el.select();
    try {
      document.execCommand("copy");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
    document.body.removeChild(el);
  }

  const isPersoLink = !!(link?.target_name || link?.montant_perso);

  /* ── Bloc réutilisable : lien actif + actions ── */
  const linkBlock = link?.url && (
    <div className="space-y-3 pt-3">
      <div className="rounded-2xl bg-wave-50 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-wave-400 mb-1">
          Lien actif
        </p>
        <p className="text-sm font-mono text-wave-700 break-all">{link.url}</p>
        {link.expires_at && (
          <p className="mt-2 text-[10px] text-wave-500">
            Expire le {new Date(link.expires_at).toLocaleDateString("fr-FR")}
          </p>
        )}
      </div>

      {isPersoLink && (
        <div className="rounded-2xl bg-brand-50 p-4 border border-brand-100">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-500 mb-2">
            Invitation personnalisée
          </p>
          {(link.target_prenom || link.target_name) && (
            <div className="flex items-center gap-2 mb-1.5">
              <UserPlus className="h-4 w-4 text-brand-500" />
              <span className="text-sm font-semibold text-wave-800">
                {[link.target_prenom, link.target_name].filter(Boolean).join(" ")}
              </span>
            </div>
          )}
          {link.montant_perso && (
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-brand-500" />
              <span className="text-sm font-semibold text-wave-800">
                {fcfa(link.montant_perso)}
                <span className="text-[10px] font-normal text-wave-500 ml-1">
                  (au lieu de {fcfa(groupe?.montant_standard)})
                </span>
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={doCopy} className="btn-primary flex-1 !py-3">
          {copied ? (
            <><Check className="h-4 w-4" /> Copié !</>
          ) : (
            <><Copy className="h-4 w-4" /> Copier le lien</>
          )}
        </button>
      </div>
      <div className="flex gap-2">
        <button onClick={resetForm} className="btn-ghost flex-1 !py-2.5 text-xs">
          Nouveau lien
        </button>
        <button
          onClick={deactivate}
          className="flex-1 rounded-xl bg-red-50 py-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-100"
        >
          Désactiver
        </button>
      </div>
    </div>
  );

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
        className="flex flex-col w-full max-w-md rounded-t-3xl bg-white shadow-soft sm:rounded-3xl max-h-[90vh]"
      >
        {/* HEADER */}
        <div className="flex shrink-0 items-center justify-between border-b border-wave-100 px-5 py-4">
          <h3 className="font-display text-lg font-extrabold">Invitation</h3>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-wave-100 text-wave-500 transition hover:bg-wave-50 hover:text-wave-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ONGLETS */}
        <div className="flex shrink-0 border-b border-wave-100 px-5">
          {[
            { key: "public", label: "Lien Public", Icon: Link2 },
            { key: "perso", label: "Personnalisé", Icon: UserPlus },
          ].map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`relative flex-1 py-3 text-center text-sm font-bold transition-colors ${
                tab === key ? "text-brand-600" : "text-wave-400 hover:text-wave-600"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                <Icon className="h-4 w-4" />
                {label}
              </div>
              {tab === key && (
                <motion.div
                  layoutId="invite-tab-bar"
                  className="absolute bottom-0 left-2 right-2 h-[3px] rounded-full wave-bg"
                />
              )}
            </button>
          ))}
        </div>

        {/* CONTENU */}
        <div className="overflow-y-auto px-5 pb-5">
          {loading ? (
            <div className="h-20 animate-pulse rounded-2xl bg-wave-100/60 mt-4" />
          ) : (
            <>
              {/* ─── ONGLET PUBLIC ─── */}
              {tab === "public" && (
                <>
                  {link?.url && !isPersoLink ? (
                    linkBlock
                  ) : (
                    <div className="space-y-4 pt-4">
                      <div className="rounded-2xl bg-wave-50 p-4 text-center">
                        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-brand-100 text-brand-600">
                          <Link2 className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-semibold text-wave-800">
                          Lien ouvert à tous
                        </p>
                        <p className="mt-1 text-[10px] text-wave-500 leading-relaxed">
                          Tout le monde pourra utiliser ce lien pour rejoindre le groupe avec
                          le montant standard ({fcfa(groupe?.montant_standard || 0)}).
                        </p>
                      </div>
                      <button
                        onClick={generatePublic}
                        disabled={generating}
                        className="btn-primary !py-3 w-full"
                      >
                        {generating ? "Génération..." : "Générer un lien public"}
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* ─── ONGLET PERSONNALISÉ ─── */}
              {tab === "perso" && (
                <>
                  {link?.url && isPersoLink ? (
                    linkBlock
                  ) : (
                    <div className="space-y-4 pt-4">
                      <div className="rounded-2xl bg-brand-50 p-4 border border-brand-100 space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-500">
                          Destinataire ciblé
                        </p>
                        <p className="text-[11px] text-wave-500 leading-relaxed">
                          Les champs Nom et Prénom seront pré-remplis automatiquement pour
                          l&apos;invité à l&apos;ouverture du lien.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="label">Prénom</label>
                            <input
                              className="input"
                              placeholder="Ex: Ibrahim"
                              value={targetPrenom}
                              onChange={(e) => setTargetPrenom(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="label">Nom *</label>
                            <input
                              className="input"
                              placeholder="Ex: Koné"
                              value={targetNom}
                              onChange={(e) => setTargetNom(e.target.value)}
                            />
                          </div>
                        </div>

                        {groupe?.montant_personnalisable && (
                          <div>
                            <label className="label">Montant de cotisation (FCFA)</label>
                            <input
                              type="number"
                              min="0"
                              className="input"
                              placeholder={`Standard : ${groupe?.montant_standard || 0}`}
                              value={montantPerso}
                              onChange={(e) => setMontantPerso(e.target.value)}
                            />
                            <p className="mt-1 text-[10px] text-wave-500">
                              Ce montant remplacera le montant standard ({fcfa(groupe?.montant_standard || 0)}) pour cette personne.
                            </p>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={generatePerso}
                        disabled={generating || !targetNom.trim()}
                        className="btn-primary !py-3 w-full"
                      >
                        {generating ? "Génération..." : "Générer le lien personnalisé"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

























function AddMembreModal({ groupeId, groupe, onClose }) {
  const [f, setF] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    montant_perso: "",
  });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setErr("");
    setLoading(true);
    try {
      const payload = { ...f };
      if (!payload.montant_perso) delete payload.montant_perso;
      else payload.montant_perso = parseInt(payload.montant_perso);
      await api.post(`/groupes/${groupeId}/membres`, payload);
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
          <h3 className="font-display text-lg font-extrabold">
            Ajouter un membre
          </h3>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-wave-100 text-wave-500 transition hover:bg-wave-50 hover:text-wave-700"
          >
            ✕
          </button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Prénom</label>
              <input
                className="input"
                value={f.prenom}
                onChange={(e) => setF({ ...f, prenom: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Nom *</label>
              <input
                className="input"
                value={f.nom}
                onChange={(e) => setF({ ...f, nom: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">Téléphone</label>
            <PhoneInput
              value={f.telephone}
              onChange={(val) => setF({ ...f, telephone: val })}
              defaultCountry="CI"
            />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input
              type="email"
              className="input"
              value={f.email}
              onChange={(e) => setF({ ...f, email: e.target.value })}
            />
          </div>
          {groupe?.montant_personnalisable && (
            <div>
              <label className="label">Montant personnalisé (FCFA)</label>
              <input
                type="number"
                className="input"
                value={f.montant_perso}
                onChange={(e) => setF({ ...f, montant_perso: e.target.value })}
                placeholder={`Par défaut: ${groupe.montant_standard}`}
              />
            </div>
          )}
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
              disabled={loading || !f.nom}
              className="btn-primary flex-1 !py-3"
            >
              {loading ? "Ajout..." : "Ajouter le membre"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SettingsTarifsModal({ groupeId, groupe, periode, onClose }) {
  const [f, setF] = useState({
    montant_standard: groupe?.montant_standard || "",
    adhesion_active: groupe?.adhesion_active || false,
    adhesion_montant: groupe?.adhesion_montant || "",
    montant_personnalisable: groupe?.montant_personnalisable || false,
    wave_numero: groupe?.wave_numero || "",
    periode_debut: periode?.date_debut ? periode.date_debut.substring(0, 10) : "",
    periode_fin: periode?.date_fin ? periode.date_fin.substring(0, 10) : "",
  });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setErr("");
    setLoading(true);
    try {
      const payload = { ...f };
      payload.montant_standard = parseInt(payload.montant_standard) || 0;
      payload.adhesion_montant = parseInt(payload.adhesion_montant) || 0;
      await api.put(`/groupes/${groupeId}`, payload);
      onClose(true);
    } catch (e) {
      setErr(e.response?.data?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-wave-900/40 backdrop-blur-sm sm:place-items-center"
      onClick={() => onClose(false)}
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
            Paramètres & Tarifs
          </h3>
          <button
            onClick={() => onClose(false)}
            className="grid h-9 w-9 place-items-center rounded-full border border-wave-100 text-wave-500 transition hover:bg-wave-50 hover:text-wave-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-5">
          <div className="space-y-3.5 pt-3">
            {periode && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-wave-50/50 border border-wave-100">
                <div className="col-span-2">
                  <p className="text-sm font-semibold text-wave-800">Période en cours</p>
                  <p className="text-[10px] text-wave-500">Modifiez les dates de la cotisation actuelle</p>
                </div>
                <div>
                  <label className="label">Date de début</label>
                  <input
                    type="date"
                    className="input"
                    value={f.periode_debut}
                    onChange={(e) => setF({ ...f, periode_debut: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Date de fin</label>
                  <input
                    type="date"
                    className="input"
                    value={f.periode_fin}
                    onChange={(e) => setF({ ...f, periode_fin: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="label">Montant standard (FCFA)</label>
              <input
                type="number"
                min="0"
                className="input"
                value={f.montant_standard}
                onChange={(e) =>
                  setF({ ...f, montant_standard: e.target.value })
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-wave-50 p-3.5">
              <div>
                <p className="text-sm font-semibold text-wave-800">
                  Montant personnalisable
                </p>
                <p className="text-[10px] text-wave-500">
                  Permet un montant différent par membre
                </p>
              </div>
              <button
                onClick={() =>
                  setF({
                    ...f,
                    montant_personnalisable: !f.montant_personnalisable,
                  })
                }
                className={`h-7 w-12 rounded-full transition ${f.montant_personnalisable ? "wave-bg" : "bg-wave-200"}`}
              >
                <span
                  className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${f.montant_personnalisable ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-wave-50 p-3.5">
              <div>
                <p className="text-sm font-semibold text-wave-800">
                  Frais d'adhésion
                </p>
                <p className="text-[10px] text-wave-500">
                  Frais obligatoires avant cotisation
                </p>
              </div>
              <button
                onClick={() =>
                  setF({ ...f, adhesion_active: !f.adhesion_active })
                }
                className={`h-7 w-12 rounded-full transition ${f.adhesion_active ? "wave-bg" : "bg-wave-200"}`}
              >
                <span
                  className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${f.adhesion_active ? "translate-x-6" : "translate-x-1"}`}
                />
              </button>
            </div>

            {f.adhesion_active && (
              <div>
                <label className="label">Montant adhésion (FCFA)</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={f.adhesion_montant}
                  onChange={(e) =>
                    setF({ ...f, adhesion_montant: e.target.value })
                  }
                />
              </div>
            )}

            <div>
              <label className="label">Numéro Wave (gestionnaire)</label>
              <input
                className="input"
                placeholder="Ex: +225 07 XX XX XX XX"
                value={f.wave_numero}
                onChange={(e) => setF({ ...f, wave_numero: e.target.value })}
              />
              <p className="mt-1 text-[10px] text-wave-500">
                Affiché aux membres pour paiement
              </p>
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
              <button
                onClick={() => onClose(false)}
                className="btn-ghost flex-1 !py-3"
              >
                Annuler
              </button>
              <button
                onClick={submit}
                disabled={loading}
                className="btn-primary flex-1 !py-3"
              >
                {loading ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
