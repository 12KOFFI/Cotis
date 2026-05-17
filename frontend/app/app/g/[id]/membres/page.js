"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, UserPlus, Star, Trash2, Edit3, ShieldCheck, QrCode } from "lucide-react";
import { useSearchParams } from "next/navigation";
import AppShell from "../../../../components/AppShell";
import PhoneInput from "../../../../components/PhoneInput";
import { api, fcfa } from "../../../../lib/api";

const STATUT_COULEURS = {
  a_jour: "bg-brand-50 text-brand-600",
  partiel: "bg-amber-50 text-amber-700",
  en_retard: "bg-red-50 text-red-700",
};

export default function MembresPage() {
  const { id } = useParams();
  const [membres, setMembres] = useState([]);
  const [groupe, setGroupe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const sp = useSearchParams();
  const [addOpen, setAddOpen] = useState(sp?.get("action") === "add");

  async function loadAll() {
    const [m, g] = await Promise.all([
      api.get(`/groupes/${id}/membres`),
      api.get(`/groupes/${id}`),
    ]);
    setMembres(m.data.membres);
    setGroupe(g.data.groupe);
    setLoading(false);
  }
  useEffect(() => { loadAll(); }, [id]);

  const filtered = membres.filter((m) =>
    `${m.prenom || ""} ${m.nom} ${m.telephone || ""} ${m.email || ""}`.toLowerCase().includes(q.toLowerCase())
  );

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
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-wave-400"/>
          <input className="input pl-10" placeholder="Rechercher un membre..." value={q} onChange={(e)=>setQ(e.target.value)}/>
        </div>
        <button onClick={()=>setAddOpen(true)} className="btn-primary shrink-0 !px-4 !py-2.5"><UserPlus className="h-4 w-4"/><span className="hidden sm:inline">Ajouter</span></button>
      </div>

      {!loading && filtered.length > 0 && (
        <p className="mb-3 text-xs text-wave-500">{filtered.length} membre{filtered.length > 1 ? "s" : ""}</p>
      )}

      {loading ? (
        <div className="space-y-2">{[1,2,3,4].map(i=><div key={i} className="h-[72px] animate-pulse rounded-2xl bg-wave-100/60"/>)}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((m, idx)=>(
            <motion.div
              key={m.id}
              initial={{opacity:0,y:8}}
              animate={{opacity:1,y:0}}
              transition={{delay: idx*0.02}}
              className="card flex items-center gap-3"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full wave-bg text-sm font-bold text-white">
                {(m.prenom||m.nom||"?")[0]}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-bold">{m.prenom} {m.nom}</p>
                  {m.role === "tresorier" && <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-600"><Star className="h-2.5 w-2.5 fill-amber-400"/> Trésorier</span>}
                  {m.role === "gestionnaire" && <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-wave-50 px-1.5 py-0.5 text-[9px] font-semibold text-wave-600"><ShieldCheck className="h-2.5 w-2.5"/> Gestion</span>}
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <p className="truncate text-[11px] text-wave-400">{m.telephone || m.email || "—"}</p>
                  <span className={`hidden shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold capitalize sm:inline-block ${STATUT_COULEURS[m.statut_cotisation] || "bg-wave-50 text-wave-600"}`}>
                    {(m.statut_cotisation || "a_jour").replaceAll("_"," ")}
                  </span>
                  {m.adhesion && m.adhesion.statut !== "paye" && (
                    <span className="hidden shrink-0 rounded-full bg-red-50 px-1.5 py-0.5 text-[9px] font-semibold text-red-600 sm:inline-block">Adhésion due</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold capitalize sm:hidden ${STATUT_COULEURS[m.statut_cotisation] || "bg-wave-50 text-wave-600"}`}>
                  {(m.statut_cotisation || "a_jour").replaceAll("_"," ")}
                </span>
                <Link href={`/app/g/${id}/membres/${m.id}`} className="grid h-8 w-8 place-items-center rounded-lg bg-wave-50 text-wave-600 transition hover:bg-wave-100"><QrCode className="h-3.5 w-3.5"/></Link>
                {m.role !== "gestionnaire" && (
                  <>
                    <button onClick={()=>toggleTresorier(m)} title="Trésorier" className="grid h-8 w-8 place-items-center rounded-lg bg-wave-50 text-wave-600 transition hover:bg-wave-100"><Star className="h-3.5 w-3.5"/></button>
                    <button onClick={()=>removeMembre(m)} title="Supprimer" className="grid h-8 w-8 place-items-center rounded-lg bg-red-50 text-red-500 transition hover:bg-red-100"><Trash2 className="h-3.5 w-3.5"/></button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-wave-500">Aucun membre trouvé.</p>
              <button onClick={()=>setAddOpen(true)} className="btn-primary mt-3 text-sm"><UserPlus className="h-4 w-4"/> Ajouter un membre</button>
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
