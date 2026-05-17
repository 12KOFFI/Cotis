"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Users, Wallet, ArrowRight, ShieldCheck } from "lucide-react";
import { api, fcfa, formatMoney, auth } from "../lib/api";
import AppShell from "../components/AppShell";

export default function AppHome() {
  const router = useRouter();
  const [groupes, setGroupes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [editGroup, setEditGroup] = useState(null);
  const [f, setF] = useState({ devise: "FCFA", montant_standard: "", adhesion_active: false, adhesion_montant: "" });
  const [saving, setSaving] = useState(false);

  function fetchGroupes() {
    api.get("/groupes").then((r) => {
      setGroupes(r.data.groupes || []);
      const u = auth.getUser();
      if (u && u.role === "membre" && r.data.groupes?.length === 1 && window.location.pathname === "/app") {
        router.push(`/app/m/${r.data.groupes[0].id}`);
      }
    }).finally(() => setLoading(false));
  }

  useEffect(() => {
    const u = auth.getUser();
    if (!u) { router.push("/login"); return; }
    setUser(u);
    if (u.role === "super_admin") { router.push("/app/admin"); return; }
    fetchGroupes();
  }, [router]);

  async function saveAmounts() {
    setSaving(true);
    try {
      await api.put(`/groupes/${editGroup.id}`, {
        devise: f.devise,
        montant_standard: f.montant_standard,
        adhesion_active: f.adhesion_active,
        adhesion_montant: f.adhesion_active ? f.adhesion_montant : 0
      });
      setEditGroup(null);
      fetchGroupes();
    } catch(e) {
      alert("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Mes groupes">
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-4 relative overflow-hidden rounded-3xl bg-brand-50 p-5 sm:p-10 border border-brand-100/50 shadow-sm flex items-center justify-between min-h-[140px] sm:min-h-[180px]">
        <div className="relative z-10 w-[60%] sm:w-auto sm:max-w-xl">
          <p className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-white bg-brand-500 px-2 py-0.5 rounded-full mb-2">
            <ShieldCheck className="h-3 w-3" /> Sécurisé
          </p>
          <h2 className="font-display text-2xl font-extrabold sm:text-4xl text-wave-900 leading-tight">
            Bienvenue, {user?.name?.split(" ")[0]}
          </h2>
          <p className="mt-1.5 text-sm sm:text-lg font-medium text-wave-700 leading-snug">
            Gérez vos tontines en toute confiance.
          </p>
        </div>
        
        {/* Illustration SVG : Totalement visible sur mobile et bureau */}
        <div className="absolute right-0 bottom-0 sm:static w-[140px] sm:w-[260px] pointer-events-none opacity-100 sm:opacity-90 flex justify-end">
          <svg width="100%" viewBox="0 0 240 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="30" width="160" height="110" rx="24" fill="url(#card_grad)" className="shadow-lg drop-shadow-xl" />
            <rect x="40" y="60" width="120" height="50" rx="12" fill="white" fillOpacity="0.25" />
            <rect x="40" y="60" width="50" height="50" rx="12" fill="white" fillOpacity="0.4" />
            <circle cx="170" cy="130" r="36" fill="#10B981" className="drop-shadow-lg" />
            <path d="M155 130 L165 140 L185 120" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="190" cy="40" r="20" fill="#F59E0B" className="drop-shadow-md" />
            <circle cx="45" cy="155" r="12" fill="#60A5FA" className="drop-shadow-sm" />
            <defs>
              <linearGradient id="card_grad" x1="20" y1="30" x2="180" y2="140" gradientUnits="userSpaceOnUse">
                <stop stopColor="#1E3A8A" />
                <stop offset="1" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </motion.div>

      <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x hide-scrollbar sm:flex-wrap sm:justify-center sm:gap-6 sm:overflow-visible sm:pb-0 sm:pt-0">
          <Link href="/app/groupes/new" className="w-[80vw] max-w-[280px] shrink-0 snap-center sm:w-[320px]">
            <div className="card h-full flex flex-col items-center justify-center gap-3 border-dashed border-2 border-wave-200 bg-transparent transition hover:bg-wave-50 min-h-[140px]">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-wave-100 text-wave-600"><Plus className="h-6 w-6" /></span>
              <p className="font-bold text-wave-700">Nouveau groupe</p>
            </div>
          </Link>

          {!loading && groupes.map((g, idx) => {
            const isManager = g.gestionnaire_id === user?.id;
            const linkHref = user?.role === "membre" && !isManager ? `/app/m/${g.id}` : `/app/g/${g.id}`;
            return (
              <motion.div key={g.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="w-[85vw] max-w-[300px] shrink-0 snap-center sm:w-[320px] relative group">
                <Link href={linkHref} className="block h-full">
                  <div className={`card h-full flex flex-col justify-between overflow-hidden relative shadow-lg transition-transform group-hover:scale-[1.02] ${isManager ? 'bg-gradient-to-br from-[#1e40af] to-[#1e3a8a] text-white border-0' : 'bg-white'}`}>
                    {isManager && <div className="absolute top-0 right-0 p-4 opacity-10"><Wallet className="h-24 w-24" /></div>}
                    <div className="relative z-10 flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <span className={`grid h-12 w-12 place-items-center rounded-2xl font-bold text-lg ${isManager ? 'bg-white text-[#1e40af]' : 'wave-bg text-white'}`}>
                          {g.nom[0]}
                        </span>
                        <div>
                          <p className={`font-display font-bold text-lg ${isManager ? 'text-white' : 'text-wave-900'}`}>{g.nom}</p>
                          <span className={`text-[11px] uppercase font-bold tracking-wider ${isManager ? 'text-blue-200' : 'text-wave-500'}`}>{g.type}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="relative z-10 mb-4">
                      <p className={`text-sm ${isManager ? 'text-blue-200' : 'text-wave-500'}`}>Solde de la caisse</p>
                      <p className={`font-display text-3xl font-extrabold ${isManager ? 'text-white' : 'text-wave-900'}`}>{formatMoney(g.caisse?.solde || 0, g.devise)}</p>
                    </div>

                    <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-3">
                      <span className={`text-sm font-bold flex items-center gap-1 ${isManager ? 'text-white' : 'text-wave-600'}`}>
                        Ouvrir <ArrowRight className="h-4 w-4" />
                      </span>
                      {isManager && (
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setF({ devise: g.devise || "FCFA", montant_standard: g.montant_standard || "", adhesion_active: g.adhesion_active || false, adhesion_montant: g.adhesion_montant || "" }); setEditGroup(g); }} className="text-sm bg-white/20 hover:bg-white/30 transition px-3 py-1.5 rounded-xl text-white font-bold flex items-center gap-1">
                          Tarifs
                        </button>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {!loading && groupes.length === 0 && (
        <motion.p initial={{opacity:0}} animate={{opacity:1}} className="mt-8 text-center text-sm text-wave-500">
          Vous n'avez pas encore de groupe. Créez-en un pour commencer !
        </motion.p>
      )}

      {/* Modal d'édition des montants */}
      {editGroup && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-wave-900/40 backdrop-blur-sm sm:place-items-center" onClick={()=>setEditGroup(null)}>
          <motion.div initial={{y:60,opacity:0}} animate={{y:0,opacity:1}} transition={{type:"spring",damping:25,stiffness:300}} onClick={(e)=>e.stopPropagation()} className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-soft sm:rounded-3xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-display text-lg font-extrabold">Tarifs - {editGroup.nom}</h3>
              <button onClick={()=>setEditGroup(null)} className="grid h-9 w-9 place-items-center rounded-full border border-wave-100 text-wave-500 hover:bg-wave-50">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Devise</label>
                <select className="input text-lg font-bold" value={f.devise} onChange={(e)=>setF({...f, devise: e.target.value})}>
                  <option value="FCFA">FCFA</option>
                  <option value="EUR">Euro (€)</option>
                  <option value="USD">Dollar ($)</option>
                  <option value="GNF">Franc Guinéen (GNF)</option>
                  <option value="MAD">Dirham (MAD)</option>
                </select>
              </div>
              <div>
                <label className="label">Montant de la cotisation ({f.devise})</label>
                <input type="number" min="0" className="input text-lg font-bold" placeholder="Entrer un montant" value={f.montant_standard} onChange={(e)=>setF({...f, montant_standard: e.target.value?parseInt(e.target.value):""})} />
                <p className="text-[10px] text-wave-500 mt-1">Ce montant s'appliquera par défaut à chaque période.</p>
              </div>
              <div className="pt-2 border-t border-wave-100">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input type="checkbox" checked={f.adhesion_active} onChange={(e)=>setF({...f, adhesion_active: e.target.checked})} className="h-5 w-5 rounded text-wave-600 focus:ring-wave-600" />
                  <span className="text-base font-bold text-wave-800">Frais d'adhésion activés</span>
                </label>
                {f.adhesion_active && (
                  <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}}>
                    <label className="label mt-2">Montant de l'adhésion ({f.devise})</label>
                    <input type="number" min="0" className="input text-lg font-bold" placeholder="Entrer un montant" value={f.adhesion_montant} onChange={(e)=>setF({...f, adhesion_montant: e.target.value?parseInt(e.target.value):""})} />
                  </motion.div>
                )}
              </div>
              <button onClick={saveAmounts} disabled={saving} className="btn-primary w-full !py-3 mt-2 text-base">
                {saving ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AppShell>
  );
}
