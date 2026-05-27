"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, UserPlus, Star, Trash2, Edit3, ShieldCheck, QrCode, Link2, Check } from "lucide-react";
import { useSearchParams } from "next/navigation";
import AppShell from "../../../../components/AppShell";
import PhoneInput from "../../../../components/PhoneInput";
import { api, fcfa } from "../../../../lib/api";

const STATUT_COULEURS = {
  a_jour: "bg-emerald-50 text-emerald-600 border border-emerald-100",
  partiel: "bg-sky-50 text-sky-700 border border-sky-100",
  en_attente: "bg-amber-50 text-amber-700 border border-amber-100",
  en_retard: "bg-orange-50 text-orange-700 border border-orange-100",
  impaye: "bg-rose-50 text-rose-700 border border-rose-100",
};

const STATUT_LABELS = {
  a_jour: "À jour",
  partiel: "Paiement partiel",
  en_attente: "En attente",
  en_retard: "En retard",
  impaye: "Impayé",
};

const TAB_ACTIVE_COLORS = {
  all: "wave-bg text-white border-transparent shadow-md shadow-wave-200",
  a_jour: "bg-emerald-600 text-white border-transparent shadow-md shadow-emerald-200",
  partiel: "bg-sky-600 text-white border-transparent shadow-md shadow-sky-200",
  en_attente: "bg-amber-600 text-white border-transparent shadow-md shadow-amber-200",
  en_retard: "bg-orange-600 text-white border-transparent shadow-md shadow-orange-200",
  impaye: "bg-rose-600 text-white border-transparent shadow-md shadow-rose-200",
};

export default function MembresPage() {
  const { id } = useParams();
  const [membres, setMembres] = useState([]);
  const [groupe, setGroupe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const sp = useSearchParams();
  const [addOpen, setAddOpen] = useState(sp?.get("action") === "add");
  const [copiedId, setCopiedId] = useState(null);

  async function loadAll() {
    const [m, g] = await Promise.all([
      api.get(`/groupes/${id}/membres`),
      api.get(`/groupes/${id}`),
    ]);
    setMembres(m.data.membres);
    setGroupe(g.data.groupe);
    setLoading(false);
  }
  useEffect(() => { if (!id || id === 'undefined') return; loadAll(); }, [id]);

  const filtered = membres.filter((m) => {
    const matchesSearch = `${m.prenom || ""} ${m.nom} ${m.telephone || ""} ${m.email || ""}`.toLowerCase().includes(q.toLowerCase());
    const mStatus = m.statut_cotisation || "a_jour";
    const matchesStatus = selectedStatus === "all" || mStatus === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    all: membres.length,
    a_jour: membres.filter(m => (m.statut_cotisation || "a_jour") === "a_jour").length,
    partiel: membres.filter(m => (m.statut_cotisation || "a_jour") === "partiel").length,
    en_attente: membres.filter(m => (m.statut_cotisation || "a_jour") === "en_attente").length,
    en_retard: membres.filter(m => (m.statut_cotisation || "a_jour") === "en_retard").length,
    impaye: membres.filter(m => (m.statut_cotisation || "a_jour") === "impaye").length,
  };

  async function toggleTresorier(m) {
    await api.post(`/groupes/${id}/membres/${m.id}/tresorier`);
    loadAll();
  }
  async function removeMembre(m) {
    if (!confirm(`Supprimer ${m.prenom} ${m.nom} ?`)) return;
    try {
      await api.delete(`/groupes/${id}/membres/${m.id}`);
      loadAll();
    } catch (e) {
      alert(e.response?.data?.message || "Erreur");
    }
  }

  return (
    <AppShell title="Membres" groupeId={id} back>
      {/* BARRE DE RECHERCHE & BOUTON AJOUTER */}
      <div className="mb-4 flex items-center gap-3 px-1">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-wave-400"/>
          <input className="input pl-11 !py-3" placeholder="Rechercher un membre..." value={q} onChange={(e)=>setQ(e.target.value)}/>
        </div>
        <button onClick={()=>setAddOpen(true)} className="btn-primary shrink-0 !py-3 !px-4 shadow-md shadow-brand-500/20 active:scale-95 transition-transform flex items-center gap-1.5">
          <UserPlus className="h-5 w-5"/>
          <span className="hidden sm:inline">Ajouter</span>
        </button>
      </div>

      {/* FILTRES PAR STATUT (COLORÉS LORSQU'ACTIFS) */}
      {!loading && (
        <div className="mb-6 flex flex-wrap gap-2 px-1">
          {[
            { id: "all", label: "Tous" },
            { id: "a_jour", label: "À jour" },
            { id: "partiel", label: "Partiel" },
            { id: "en_attente", label: "En attente" },
            { id: "en_retard", label: "En retard" },
            { id: "impaye", label: "Impayés" },
          ].map((tab) => {
            const isActive = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-black transition-all border ${
                  isActive
                    ? TAB_ACTIVE_COLORS[tab.id]
                    : "bg-white text-wave-600 border-wave-100 hover:bg-wave-50 active:scale-95"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`grid h-5 min-w-[20px] place-items-center rounded-full px-1 text-[10px] font-black ${
                    isActive ? "bg-white/20 text-white" : "bg-wave-50 text-wave-500"
                  }`}
                >
                  {counts[tab.id]}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* COMPTEUR DE MEMBRES */}
      {!loading && filtered.length > 0 && (
        <p className="mb-3 px-1 text-xs font-bold text-wave-400 uppercase tracking-wider">{filtered.length} membre{filtered.length > 1 ? "s" : ""}</p>
      )}

      {/* LISTE DES MEMBRES */}
      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i=><div key={i} className="h-20 animate-pulse rounded-[1.5rem] bg-wave-100/60"/>)}</div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((m, idx)=>(
            <motion.div
              key={m.id}
              initial={{opacity:0,y:8}}
              animate={{opacity:1,y:0}}
              transition={{delay: idx*0.02}}
              className="bg-white rounded-2xl p-4 shadow-sm border border-wave-100 flex flex-col gap-3.5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Initiales avec fond doux */}
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full wave-bg text-base font-black text-white shadow-inner">
                    {(m.prenom||m.nom||"?")[0]}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="truncate text-sm font-extrabold text-wave-900">{m.prenom} {m.nom}</p>
                      {m.role === "tresorier" && <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-600 border border-amber-100"><Star className="h-2.5 w-2.5 fill-amber-400"/> Trésorier</span>}
                      {m.role === "gestionnaire" && <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-wave-50 px-2 py-0.5 text-[9px] font-bold text-wave-600 border border-wave-100"><ShieldCheck className="h-2.5 w-2.5"/> Gestion</span>}
                    </div>
                    <p className="truncate text-xs font-semibold text-wave-400 mt-0.5">{m.telephone || m.email || "—"}</p>
                  </div>
                </div>

                {/* Badges de Statut */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold border ${STATUT_COULEURS[m.statut_cotisation] || "bg-wave-50 text-wave-600 border-wave-100"}`}>
                    {STATUT_LABELS[m.statut_cotisation] || STATUT_LABELS.a_jour}
                  </span>
                  {m.adhesion && m.adhesion.statut !== "paye" && (
                    <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-bold text-rose-600 border border-rose-100">Adhésion due</span>
                  )}
                </div>
              </div>

              {/* Raccourcis d'actions tactiles */}
              <div className="flex items-center justify-between border-t border-wave-100 pt-3 mt-0.5">
                <div className="flex gap-2">
                  {m.access_token && !m.user_id && (
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/acces/${m.access_token}`;
                        navigator.clipboard.writeText(url);
                        setCopiedId(m.id);
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      title="Copier le lien d'accès"
                      className={`flex items-center justify-center gap-1.5 h-9 px-3 rounded-xl transition-all ${copiedId === m.id ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-wave-50 text-wave-600 border border-wave-100 hover:bg-wave-100"}`}
                    >
                      {copiedId === m.id ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                      <span className="text-[10px] font-extrabold">{copiedId === m.id ? "Lien copié" : "Partager l'accès"}</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/app/g/${id}/membres/${m.id}`} title="Voir la carte QR" className="grid h-9 w-9 place-items-center rounded-xl bg-wave-50 text-wave-600 border border-wave-100 transition hover:bg-wave-100 active:scale-90">
                    <QrCode className="h-4.5 w-4.5"/>
                  </Link>
                  
                  {m.role !== "gestionnaire" && (
                    <>
                      <button onClick={()=>toggleTresorier(m)} title={m.role === "tresorier" ? "Retirer Trésorier" : "Nommer Trésorier"} className={`grid h-9 w-9 place-items-center rounded-xl transition border ${m.role === "tresorier" ? "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100" : "bg-wave-50 border-wave-100 text-wave-500 hover:bg-wave-100"} active:scale-90`}>
                        <Star className={`h-4 w-4 ${m.role === "tresorier" ? "fill-amber-500 text-amber-500" : ""}`}/>
                      </button>
                      <button onClick={()=>removeMembre(m)} title="Supprimer le membre" className="grid h-9 w-9 place-items-center rounded-xl bg-rose-50 border border-rose-100 text-rose-500 transition hover:bg-rose-100 active:scale-90">
                        <Trash2 className="h-4 w-4"/>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="rounded-3xl bg-wave-50 py-12 text-center border-2 border-dashed border-wave-200">
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-white text-wave-400 shadow-sm">
                <Search className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-wave-500 mb-3">Aucun membre trouvé.</p>
              <button onClick={()=>setAddOpen(true)} className="btn-primary text-xs !py-2.5 !px-4">
                <UserPlus className="h-4 w-4" /> Ajouter un membre
              </button>
            </div>
          )}
        </div>
      )}

      {addOpen && <AddModal groupeId={id} groupe={groupe} onClose={()=>{setAddOpen(false);loadAll();}}/>}
    </AppShell>
  );
}

function AddModal({ groupeId, groupe, onClose }) {
  const [f, setF] = useState({ nom: "", prenom: "", telephone: "", email: "", montant_perso: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(){
    setErr(""); setLoading(true);
    try {
      const payload = { ...f };
      if (!payload.montant_perso) delete payload.montant_perso; else payload.montant_perso = parseInt(payload.montant_perso);
      await api.post(`/groupes/${groupeId}/membres`, payload);
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
          <h3 className="font-display text-lg font-extrabold">Ajouter un membre</h3>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-wave-100 text-wave-500 transition hover:bg-wave-50 hover:text-wave-700">✕</button>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Prénom</label><input className="input" value={f.prenom} onChange={(e)=>setF({...f,prenom:e.target.value})}/></div>
            <div><label className="label">Nom *</label><input className="input" value={f.nom} onChange={(e)=>setF({...f,nom:e.target.value})}/></div>
          </div>
          <div><label className="label">Téléphone</label><PhoneInput value={f.telephone} onChange={(val)=>setF({...f,telephone:val})} defaultCountry="CI" /></div>
          <div><label className="label">E-mail</label><input type="email" className="input" value={f.email} onChange={(e)=>setF({...f,email:e.target.value})}/></div>
          {groupe?.montant_personnalisable && (
            <div>
              <label className="label">Montant personnalisé (FCFA)</label>
              <input type="number" className="input" value={f.montant_perso} onChange={(e)=>setF({...f,montant_perso:e.target.value})} placeholder={`Par défaut: ${groupe.montant_standard}`}/>
            </div>
          )}
          {err && <motion.p initial={{opacity:0,y:-5}} animate={{opacity:1,y:0}} className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{err}</motion.p>}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="btn-ghost flex-1 !py-3">Annuler</button>
            <button onClick={submit} disabled={loading || !f.nom} className="btn-primary flex-1 !py-3">{loading?"Ajout...":"Ajouter le membre"}</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
