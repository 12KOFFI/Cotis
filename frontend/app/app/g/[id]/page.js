"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Wallet, TrendingUp, Users, UserPlus, AlertTriangle, CheckCircle2,
  Clock, Plus, FileDown, QrCode, ArrowUpRight, Download, Link2, Send,
  ImageUp, X, Eye, Trash2, BellRing
} from "lucide-react";
import AppShell from "../../../components/AppShell";
import { api, fcfa, formatMoney, API_BASE, auth } from "../../../lib/api";

export default function ManagerDashboard() {
  const { id } = useParams();
  const router = useRouter();
  const sp = useSearchParams();
  const welcome = sp.get("welcome");
  const [groupe, setGroupe] = useState(null);
  const [dash, setDash] = useState(null);
  const [loading, setLoading] = useState(true);
  const [payOpen, setPayOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [demandesOpen, setDemandesOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [maCotisation, setMaCotisation] = useState(null);
  const [managerPayOpen, setManagerPayOpen] = useState(false);

  const [tarifsOpen, setTarifsOpen] = useState(false);

  async function loadAll() {
    const [g, d, m] = await Promise.all([
      api.get(`/groupes/${id}`),
      api.get(`/groupes/${id}/dashboard`),
      api.get(`/groupes/${id}/mon-dashboard`).catch(() => null),
    ]);
    setGroupe(g.data.groupe);
    setDash(d.data);
    if (m) setMaCotisation(m.data);
    setLoading(false);
  }
  useEffect(() => { loadAll(); /* eslint-disable-next-line */ }, [id]);

  function downloadWithToken(path, filename) {
    const token = auth.getToken();
    fetch(API_BASE + path, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((b) => {
        const u = URL.createObjectURL(b);
        const a = document.createElement("a");
        a.href = u; a.download = filename; a.click();
        URL.revokeObjectURL(u);
      });
  }

  return (
    <AppShell title={groupe?.nom || "Groupe"} groupeId={id} role="gestionnaire" back="/app">
      {welcome && (
        <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="mb-4 rounded-2xl bg-brand-50 p-4 text-sm text-brand-600">
           Votre groupe est créé. Invitez vos premiers membres pour commencer.
        </motion.div>
      )}

      {loading ? (
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4">
          {[1,2,3].map(i=><div key={i} className="h-28 w-[280px] shrink-0 animate-pulse rounded-3xl bg-wave-100/60"/>)}
        </div>
      ) : (
        <>
          {/* KPIs - Scroll Horizontal sur Mobile */}
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory hide-scrollbar sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-visible">
              <div className="w-[80vw] max-w-[280px] shrink-0 snap-center sm:w-auto"><KPI Icon={Wallet} label="Solde de la caisse" value={formatMoney(dash.solde_caisse, groupe?.devise)} tone="dark"/></div>
              <div className="w-[80vw] max-w-[280px] shrink-0 snap-center sm:w-auto"><KPI Icon={TrendingUp} label="Taux de collecte" value={`${dash.taux_collecte}%`} progress={dash.taux_collecte}/></div>
              <div className="w-[80vw] max-w-[280px] shrink-0 snap-center sm:w-auto"><KPI Icon={CheckCircle2} label="Membres à jour" value={`${dash.a_jour}/${dash.nb_membres_actifs}`}/></div>
              <div className="w-[80vw] max-w-[280px] shrink-0 snap-center sm:w-auto"><KPI Icon={AlertTriangle} label="En retard" value={dash.en_retard} tone="danger"/></div>
              {dash.nb_demandes > 0 && (
                <div className="w-[80vw] max-w-[280px] shrink-0 snap-center sm:w-auto"><KPI Icon={ImageUp} label="Demandes en attente" value={dash.nb_demandes} tone="dark"/></div>
              )}
            </div>
          </div>

          {/* Alertes de Confirmation */}
          {dash.nb_demandes > 0 && dash.demandes_en_attente && (
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="mt-2 rounded-2xl bg-amber-50 p-4 border border-amber-200">
              <div className="flex items-center gap-3 mb-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-600"><BellRing className="h-5 w-5"/></span>
                <div>
                  <p className="text-sm font-bold text-amber-800">
                    {dash.nb_demandes} demande{dash.nb_demandes > 1 ? "s" : ""} de paiement en attente
                  </p>
                  <p className="text-xs text-amber-600">Vérifiez les reçus soumis par vos membres.</p>
                </div>
              </div>
              <div className="space-y-2">
                {dash.demandes_en_attente.slice(0, 3).map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm ring-1 ring-amber-100">
                    <div>
                      <p className="text-sm font-bold text-wave-900">{d.membre?.prenom} {d.membre?.nom}</p>
                      <p className="text-xs text-wave-500">{fcfa(d.montant)} • {new Date(d.date_paiement).toLocaleDateString("fr-FR")}</p>
                    </div>
                    <button onClick={() => setDemandesOpen(true)} className="rounded-xl bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-200">
                      Examiner
                    </button>
                  </div>
                ))}
                {dash.nb_demandes > 3 && (
                  <button onClick={() => setDemandesOpen(true)} className="w-full rounded-xl bg-amber-100/50 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-100">
                    Voir les {dash.nb_demandes - 3} autres demandes
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Ma cotisation (gestionnaire aussi membre) */}
          {maCotisation && (
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="mt-4 rounded-2xl bg-white p-4 shadow-soft ring-1 ring-wave-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-wave-50 text-wave-700"><Wallet className="h-5 w-5"/></span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-wave-500">Ma cotisation</p>
                    <p className="text-sm font-bold text-wave-900">
                      {maCotisation.reste_a_payer > 0
                        ? `${fcfa(maCotisation.reste_a_payer)} restants`
                        : <span className="text-emerald-600">À jour ✓</span>}
                    </p>
                    <p className="text-[10px] text-wave-400">{fcfa(maCotisation.montant_verse)} versés sur {fcfa(maCotisation.montant_du)}</p>
                  </div>
                </div>
                {maCotisation.reste_a_payer > 0 && (
                  <button onClick={() => setManagerPayOpen(true)} className="rounded-xl bg-brand-50 px-4 py-2.5 text-xs font-bold text-brand-600 transition hover:bg-brand-100 whitespace-nowrap">
                    Confirmer le paiement
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Actions rapides - Grid/Scroll */}
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0 mt-4">
            <h3 className="mb-3 font-display text-base font-bold text-wave-900">Actions rapides</h3>
            <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory hide-scrollbar sm:grid sm:grid-cols-5 sm:overflow-visible">
              <button onClick={()=>setPayOpen(true)} className="card shrink-0 w-[140px] snap-center sm:w-auto flex flex-col items-center gap-2 py-4 text-center transition hover:-translate-y-0.5">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Plus className="h-6 w-6"/></span>
                <div><p className="text-sm font-bold">Encaisser</p><p className="text-xs text-wave-500">Cash/Mobile Money</p></div>
              </button>
              <button onClick={()=>setInviteOpen(true)} className="card shrink-0 w-[140px] snap-center sm:w-auto flex flex-col items-center gap-2 py-4 text-center transition hover:-translate-y-0.5">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-wave-50 text-wave-700"><UserPlus className="h-6 w-6"/></span>
                <div><p className="text-sm font-bold">Inviter</p><p className="text-xs text-wave-500">Lien ou SMS</p></div>
              </button>
              <button onClick={()=>router.push(`/app/g/${id}/membres?action=add`)} className="card shrink-0 w-[140px] snap-center sm:w-auto flex flex-col items-center gap-2 py-4 text-center transition hover:-translate-y-0.5">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Users className="h-6 w-6"/></span>
                <div><p className="text-sm font-bold">Ajouter</p><p className="text-xs text-wave-500">Un membre</p></div>
              </button>
              <button onClick={()=>setTarifsOpen(true)} className="card shrink-0 w-[140px] snap-center sm:w-auto flex flex-col items-center gap-2 py-4 text-center transition hover:-translate-y-0.5">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600"><Wallet className="h-6 w-6"/></span>
                <div><p className="text-sm font-bold">Tarifs</p><p className="text-xs text-wave-500">Cotisation</p></div>
              </button>
              <button onClick={()=>downloadWithToken(`/groupes/${id}/export/pdf`, `rapport-${id}.pdf`)} className="card shrink-0 w-[140px] snap-center sm:w-auto flex flex-col items-center gap-2 py-4 text-center transition hover:-translate-y-0.5">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-wave-50 text-wave-700"><FileDown className="h-6 w-6"/></span>
                <div><p className="text-sm font-bold">Rapport</p><p className="text-xs text-wave-500">Bilan PDF</p></div>
              </button>
              <button onClick={()=>downloadWithToken(`/groupes/${id}/export/csv`, `paiements-${id}.csv`)} className="card shrink-0 w-[140px] snap-center sm:w-auto flex flex-col items-center gap-2 py-4 text-center transition hover:-translate-y-0.5">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-wave-50 text-wave-700"><Download className="h-6 w-6"/></span>
                <div><p className="text-sm font-bold">Export</p><p className="text-xs text-wave-500">CSV complet</p></div>
              </button>
              {!dash.has_payments && (
                <button onClick={()=>setDeleteOpen(true)} className="card shrink-0 w-[140px] snap-center sm:w-auto flex flex-col items-center gap-2 py-4 text-center transition hover:-translate-y-0.5 border border-red-100 bg-red-50/30">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-red-100 text-red-600"><Trash2 className="h-6 w-6"/></span>
                  <div><p className="text-sm font-bold text-red-700">Supprimer</p><p className="text-xs text-red-500">Ce groupe</p></div>
                </button>
              )}
              <button onClick={()=>setDemandesOpen(true)} className={`card shrink-0 w-[140px] snap-center sm:w-auto flex flex-col items-center gap-2 py-4 text-center transition hover:-translate-y-0.5 ${dash.nb_demandes > 0 ? 'ring-2 ring-amber-400' : ''}`}>
                <span className={`grid h-12 w-12 place-items-center rounded-2xl ${dash.nb_demandes > 0 ? 'bg-amber-50 text-amber-600' : 'bg-wave-50 text-wave-700'}`}>
                  <ImageUp className="h-6 w-6"/>
                </span>
                <div>
                  <p className="text-sm font-bold">Demandes</p>
                  <p className="text-xs text-wave-500">{dash.nb_demandes > 0 ? `${dash.nb_demandes} en attente` : 'Validation'}</p>
                </div>
              </button>
            </motion.div>
          </div>

          {/* Dernières transactions */}
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="card lg:col-span-2 !p-0 overflow-hidden shadow-xl shadow-slate-200/50 border-slate-100">
              <div className="flex items-center justify-between p-6 border-b border-slate-50 bg-slate-50/30">
                <div>
                  <h3 className="font-display text-xl font-black text-slate-900">Dernières transactions</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Historique récent</p>
                </div>
                <Link href={`/app/g/${id}/caisse`} className="rounded-full bg-white px-4 py-2 text-xs font-black text-wave-700 shadow-sm ring-1 ring-slate-100 hover:bg-wave-50 transition-colors">Voir tout</Link>
              </div>
              <div className="p-6">
                {dash.dernieres_transactions.length === 0 ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                      <Wallet className="h-10 w-10 text-slate-200" />
                    </div>
                    <p className="text-sm font-bold text-slate-400">Aucune transaction pour le moment.</p>
                    <button onClick={()=>setPayOpen(true)} className="mt-4 text-xs font-black text-wave-600 uppercase tracking-wider">Effectuer un encaissement</button>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-50">
                    {dash.dernieres_transactions.map((t)=>(
                      <li key={t.id} className="group flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-110">
                          <ArrowUpRight className="h-6 w-6"/>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-900 truncate">{t.membre?.prenom} {t.membre?.nom}</p>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{t.date_paiement} • {t.mode}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-black text-emerald-600">+{formatMoney(t.montant, groupe?.devise)}</p>
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">{t.type}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="card !p-0 overflow-hidden shadow-xl shadow-slate-200/50 border-slate-100">
              <div className="p-6 wave-bg text-white">
                <h3 className="font-display text-xl font-black">Collecte en cours</h3>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">{dash.periode ? `Échéance ${dash.periode.echeance}` : "Aucune période active"}</p>
              </div>
              <div className="p-6">
                <div className="relative">
                  <div className="flex items-end justify-between mb-2">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Taux actuel</p>
                      <span className="font-display text-4xl font-black text-slate-900">{dash.taux_collecte}%</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total reçu</p>
                      <span className="text-sm font-black text-emerald-600">{formatMoney(dash.total_recu, groupe?.devise)}</span>
                    </div>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                    <motion.div initial={{width:0}} animate={{width:`${dash.taux_collecte}%`}} transition={{duration:1, ease: "easeOut"}} className="h-full bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/20"/>
                  </div>
                  <p className="mt-2 text-right text-[10px] font-bold text-slate-400">Objectif : {formatMoney(dash.total_attendu, groupe?.devise)}</p>
                </div>

                <div className="mt-8 space-y-3">
                  {[
                    { label: "Membres à jour", val: dash.a_jour, color: "bg-emerald-500" },
                    { label: "Paiements partiels", val: dash.partiel, color: "bg-amber-500" },
                    { label: "En retard", val: dash.en_retard, color: "bg-rose-500" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${item.color}`} />
                        <span className="text-xs font-bold text-slate-600">{item.label}</span>
                      </div>
                      <span className="text-sm font-black text-slate-900">{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Raccourcis */}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Link href={`/app/g/${id}/membres`} className="card flex items-center justify-between hover:-translate-y-0.5">
              <div className="flex items-center gap-3"><Users className="h-5 w-5 text-wave-700"/><span className="font-semibold">Gérer les membres</span></div>
              <span className="rounded-full bg-wave-50 px-2 py-0.5 text-xs font-semibold text-wave-700">{dash.nb_membres}</span>
            </Link>
            <Link href={`/app/g/${id}/caisse`} className="card flex items-center justify-between hover:-translate-y-0.5">
              <div className="flex items-center gap-3"><Wallet className="h-5 w-5 text-wave-700"/><span className="font-semibold">Caisse & grand livre</span></div>
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-600">{formatMoney(dash.solde_caisse, groupe?.devise)}</span>
            </Link>
            <button onClick={()=>setInviteOpen(true)} className="card flex items-center justify-between hover:-translate-y-0.5">
              <div className="flex items-center gap-3"><Send className="h-5 w-5 text-wave-700"/><span className="font-semibold">Invitations en attente</span></div>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">{dash.invitations_en_attente}</span>
            </button>
          </div>
        </>
      )}

      {payOpen && <PayModal groupeId={id} onClose={()=>{setPayOpen(false);loadAll();}}/>}
      {managerPayOpen && <ManagerPayModal groupeId={id} membreId={maCotisation?.membre?.id} onClose={()=>{setManagerPayOpen(false);loadAll();}}/>}
      {deleteOpen && <DeleteGroupModal groupeId={id} groupeName={groupe?.nom} onClose={()=>setDeleteOpen(false)} />}
      {inviteOpen && <InviteModal groupeId={id} onClose={()=>{setInviteOpen(false);loadAll();}}/>}
      {tarifsOpen && <TarifsModal groupe={groupe} onClose={()=>{setTarifsOpen(false);loadAll();}}/>}
      {demandesOpen && <DemandesModal groupeId={id} onClose={()=>{setDemandesOpen(false);loadAll();}}/>}
    </AppShell>
  );
}

function TarifsModal({ groupe, onClose }) {
  const [f, setF] = useState({ 
    devise: groupe.devise || "FCFA",
    montant_standard: groupe.montant_standard || "", 
    adhesion_active: groupe.adhesion_active || false, 
    adhesion_montant: groupe.adhesion_montant || "" 
  });
  const [saving, setSaving] = useState(false);

  async function saveAmounts() {
    setSaving(true);
    try {
      await api.put(`/groupes/${groupe.id}`, {
        devise: f.devise,
        montant_standard: f.montant_standard,
        adhesion_active: f.adhesion_active,
        adhesion_montant: f.adhesion_active ? f.adhesion_montant : 0
      });
      onClose();
    } catch(e) {
      alert("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Paramètres Tarifs" onClose={onClose}>
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
          <p className="text-xs text-wave-500 mt-1">Ce montant s'appliquera par défaut à chaque période.</p>
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
    </Modal>
  );
}

function KPI({ Icon, label, value, tone, progress }) {
  const toneCls = tone === "dark" ? "wave-bg text-white ring-0" : tone === "danger" ? "bg-red-50 text-red-700 ring-red-100" : "bg-white text-wave-900";
  return (
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className={`rounded-3xl p-4 shadow-soft ring-1 ring-wave-100 ${toneCls}`}>
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${tone==="dark"?"bg-white/15":"bg-wave-50 text-wave-700"}`}><Icon className="h-5 w-5"/></span>
        <div className="min-w-0">
          <p className="text-[11px] opacity-70 leading-tight">{label}</p>
          <p className="font-display text-xl font-extrabold leading-tight">{value}</p>
        </div>
      </div>
      {progress != null && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
          <motion.div initial={{width:0}} animate={{width:`${progress}%`}} transition={{duration:0.8}} className={`h-full rounded-full ${tone==="dark"?"bg-white":"wave-bg"}`}/>
        </div>
      )}
    </motion.div>
  );
}

function PayModal({ groupeId, onClose }) {
  const [membres, setMembres] = useState([]);
  const [f, setF] = useState({
    membre_id: "", type: "cotisation", montant: "", mode: "cash",
    date_paiement: new Date().toISOString().slice(0,10), note: "",
  });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    api.get(`/groupes/${groupeId}/membres`).then((r)=>setMembres(r.data.membres));
  }, [groupeId]);
  async function submit(){
    setErr(""); setLoading(true);
    try {
      await api.post(`/groupes/${groupeId}/paiements`, f);
      setSuccess(true);
      setTimeout(()=>onClose(), 1200);
    } catch(e){ setErr(e.response?.data?.message || "Erreur"); }
    finally { setLoading(false); }
  }
  return (
    <Modal title="Enregistrer un paiement" onClose={onClose}>
      {success ? (
        <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} className="flex flex-col items-center gap-3 py-6">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600"><CheckCircle2 className="h-7 w-7"/></span>
          <p className="font-display text-lg font-bold">Paiement enregistré</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="label">Membre</label>
            <select className="input" value={f.membre_id} onChange={(e)=>setF({...f,membre_id:e.target.value})}>
              <option value="">— Choisir —</option>
              {membres.map((m)=>(
                <option key={m.id} value={m.id}>{m.prenom} {m.nom}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select className="input" value={f.type} onChange={(e)=>setF({...f,type:e.target.value})}>
                <option value="cotisation">Cotisation</option>
                <option value="adhesion">Adhésion</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div>
              <label className="label">Mode</label>
              <select className="input" value={f.mode} onChange={(e)=>setF({...f,mode:e.target.value})}>
                <option value="cash">Cash</option>
                <option value="wave">Mobile Money</option>
                <option value="virement">Virement</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Montant (FCFA)</label>
              <input type="number" min="1" className="input" placeholder="Entrer un montant" value={f.montant} onChange={(e)=>setF({...f,montant:e.target.value?parseInt(e.target.value):""})}/>
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={f.date_paiement} onChange={(e)=>setF({...f,date_paiement:e.target.value})}/>
            </div>
          </div>
          <div>
            <label className="label">Note (optionnel)</label>
            <input className="input" value={f.note} onChange={(e)=>setF({...f,note:e.target.value})}/>
          </div>
          {err && <motion.p initial={{opacity:0,y:-5}} animate={{opacity:1,y:0}} className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{err}</motion.p>}
          <button onClick={submit} disabled={loading || !f.membre_id || !f.montant} className="btn-primary w-full !py-3">
            {loading?"Enregistrement...":"Enregistrer le paiement"}
          </button>
        </div>
      )}
    </Modal>
  );
}

function InviteModal({ groupeId, onClose }) {
  const [f, setF] = useState({ nom: "", prenom: "", telephone: "", email: "", canal: "lien" });
  const [created, setCreated] = useState(null);
  const [mode, setMode] = useState("global");
  const [globalLink, setGlobalLink] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get(`/groupes/${groupeId}/invite-link`).then((r) => setGlobalLink(r.data.link));
  }, [groupeId]);

  async function submit(){
    setErr(""); setLoading(true);
    try {
      const { data } = await api.post(`/groupes/${groupeId}/invitations`, f);
      setCreated(data.invitation);
    } catch(e){ setErr(e.response?.data?.message || "Erreur"); }
    finally { setLoading(false); }
  }
  async function generateGlobalLink(){
    setErr(""); setLoading(true);
    try {
      const { data } = await api.post(`/groupes/${groupeId}/invite-link`);
      setGlobalLink(data.link);
    } catch(e){ setErr(e.response?.data?.message || "Erreur"); }
    finally { setLoading(false); }
  }
  async function disableGlobalLink(){
    setErr(""); setLoading(true);
    try {
      await api.delete(`/groupes/${groupeId}/invite-link`);
      setGlobalLink(null);
    } catch(e){ setErr(e.response?.data?.message || "Erreur"); }
    finally { setLoading(false); }
  }
  async function copyLink(link){
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
        return;
      }
      const textarea = document.createElement("textarea");
      textarea.value = link;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    } catch {
      setErr("Impossible de copier automatiquement. Sélectionnez le lien manuellement.");
    }
  }
  return (
    <Modal title="Inviter un membre à rejoindre le groupe" onClose={onClose}>
      <div className="mb-4 grid grid-cols-2 rounded-2xl bg-wave-50 p-1 text-xs font-semibold">
        <button onClick={()=>setMode("global")} className={`rounded-xl px-3 py-2 transition ${mode === "global" ? "bg-white text-wave-900 shadow-sm" : "text-wave-500"}`}>Lien public</button>
        <button onClick={()=>setMode("individuel")} className={`rounded-xl px-3 py-2 transition ${mode === "individuel" ? "bg-white text-wave-900 shadow-sm" : "text-wave-500"}`}>Individuel</button>
      </div>

      {mode === "global" ? (
        <div className="space-y-3">
          <div className="rounded-3xl bg-wave-50 p-4 text-sm text-wave-600">
            Toute personne avec ce lien peut rejoindre le groupe en remplissant ses informations.
          </div>
          {globalLink ? (
            <>
              <div className="flex items-center gap-2 rounded-2xl bg-wave-50 p-3">
                <Link2 className="h-4 w-4 shrink-0 text-wave-600"/>
                <input readOnly className="flex-1 bg-transparent text-xs outline-none" value={globalLink.url}/>
                <button onClick={()=>copyLink(globalLink.url)} className="btn-primary !py-1.5 !px-3 text-xs">Copier</button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-wave-500">
                <div className="rounded-2xl bg-wave-50 p-3">Utilisé : <span className="font-bold text-wave-800">{globalLink.uses_count}</span></div>
                <div className="rounded-2xl bg-wave-50 p-3">Expire : <span className="font-bold text-wave-800">{globalLink.expires_at ? new Date(globalLink.expires_at).toLocaleDateString("fr-FR") : "Jamais"}</span></div>
              </div>
              <a href={`https://wa.me/?text=${encodeURIComponent(globalLink.url)}`} target="_blank" className="btn-primary w-full justify-center">Partager WhatsApp</a>
              <button onClick={disableGlobalLink} disabled={loading} className="btn-ghost w-full">Désactiver le lien</button>
            </>
          ) : (
            <button onClick={generateGlobalLink} disabled={loading} className="btn-primary w-full !py-3">{loading ? "Génération..." : "Générer le lien public"}</button>
          )}
          {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
        </div>
      ) : !created ? (
        <div className="space-y-3"> 
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Prénom</label><input className="input" value={f.prenom} onChange={(e)=>setF({...f,prenom:e.target.value})}/></div>
            <div><label className="label">Nom</label><input className="input" value={f.nom} onChange={(e)=>setF({...f,nom:e.target.value})}/></div>
          </div>
          <div><label className="label">Téléphone</label><input className="input" value={f.telephone} onChange={(e)=>setF({...f,telephone:e.target.value})} placeholder="+225 ..."/></div>
          <div><label className="label">E-mail</label><input className="input" type="email" value={f.email} onChange={(e)=>setF({...f,email:e.target.value})}/></div>
          <div>
            <label className="label">Canal</label>
            <select className="input" value={f.canal} onChange={(e)=>setF({...f,canal:e.target.value})}>
              <option value="lien">Lien magique</option>
              <option value="sms">SMS</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
            </select>
          </div>
          {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          <button onClick={submit} disabled={loading || !f.nom} className="btn-primary w-full">{loading?"Création...":"Créer l'invitation"}</button>
        </div>
      ) : (
        <div className="space-y-3 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600"><CheckCircle2 className="h-7 w-7"/></div>
          <p className="font-semibold">Invitation créée</p>
          <p className="text-xs text-wave-600">Partagez ce lien avec le membre :</p>
          <div className="flex items-center gap-2 rounded-2xl bg-wave-50 p-3">
            <Link2 className="h-4 w-4 text-wave-600"/>
            <input readOnly className="flex-1 bg-transparent text-xs outline-none" value={created.link}/>
            <button onClick={()=>copyLink(created.link)} className="btn-primary !py-1.5 !px-3 text-xs">Copier</button>
          </div>
          <button onClick={onClose} className="btn-ghost w-full">Fermer</button>
        </div>
      )}
    </Modal>
  );
}

const fmtDateGestionnaire = (d) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "";

const OPERATEURS_MAP = {
  orange_money: { nom: "Orange Money", cls: "bg-orange-100 text-orange-700" },
  wave: { nom: "Wave", cls: "bg-teal-100 text-teal-700" },
  moov: { nom: "Moov Money", cls: "bg-red-100 text-red-700" },
  mtn: { nom: "MTN Mobile Money", cls: "bg-yellow-100 text-yellow-800" },
};

function DemandesModal({ groupeId, onClose }) {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [motif, setMotif] = useState("");
  const [rejectId, setRejectId] = useState(null);

  async function openPreuve(paiementId) {
    setImageLoading(true);
    try {
      const response = await api.get(`/groupes/${groupeId}/paiements/${paiementId}/preuve`, {
        responseType: "blob",
      });
      const blobUrl = URL.createObjectURL(response.data);
      setImagePreview(blobUrl);
    } catch (e) {
      alert("Impossible de charger la preuve.");
    }
    setImageLoading(false);
  }

  function closePreview() {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  }

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(`/groupes/${groupeId}/paiements/demandes`);
      setDemandes(data.demandes);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, [groupeId]);

  async function doValider(id) {
    setActionLoading(id);
    try {
      await api.post(`/groupes/${groupeId}/paiements/${id}/valider`);
      await load();
    } catch (e) {
      alert(e.response?.data?.message || "Erreur");
    }
    setActionLoading(null);
  }

  async function doRefuser(id) {
    setActionLoading(id);
    try {
      await api.post(`/groupes/${groupeId}/paiements/${id}/refuser`, { motif_refus: motif || null });
      setRejectId(null);
      setMotif("");
      await load();
    } catch (e) {
      alert(e.response?.data?.message || "Erreur");
    }
    setActionLoading(null);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-wave-900/40 backdrop-blur-sm sm:place-items-center" onClick={onClose}>
      <motion.div
        initial={{y:60,opacity:0}}
        animate={{y:0,opacity:1}}
        transition={{type:"spring",damping:25,stiffness:300}}
        onClick={(e)=>e.stopPropagation()}
        className="flex flex-col w-full max-w-lg rounded-t-3xl bg-white shadow-soft sm:rounded-3xl max-h-[90vh]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-wave-100 px-5 py-4">
          <h3 className="font-display text-lg font-extrabold">Demandes en attente</h3>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-wave-100 text-wave-500 transition hover:bg-wave-50 hover:text-wave-700">✕</button>
        </div>

        <div className="overflow-y-auto px-5 pb-5 flex-1 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1,2].map(i=><div key={i} className="h-20 animate-pulse rounded-2xl bg-wave-100/60"/>)}
            </div>
          ) : demandes.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-wave-50 text-wave-400"><CheckCircle2 className="h-7 w-7"/></span>
              <p className="text-sm font-semibold text-wave-500">Aucune demande en attente</p>
            </div>
          ) : (
            demandes.map((d) => (
              <div key={d.id} className="rounded-2xl bg-wave-50 p-4 border border-wave-100">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-wave-900">{d.membre?.prenom} {d.membre?.nom}</p>
                    <p className="text-xs text-wave-500">{fmtDateGestionnaire(d.date_paiement)} • {fcfa(d.montant)}</p>
                    <p className="text-xs text-wave-400 mt-0.5">Il y a {timeAgo(d.created_at)}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {d.mode && OPERATEURS_MAP[d.mode] && (
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${OPERATEURS_MAP[d.mode].cls}`}>{OPERATEURS_MAP[d.mode].nom}</span>
                      )}
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${d.type === "adhesion" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                        {d.type === "adhesion" ? "Frais d'adhésion" : d.type === "cotisation" ? "Cotisation" : d.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => doValider(d.id)} disabled={actionLoading === d.id} className="rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-600 disabled:opacity-50">
                      {actionLoading === d.id ? "..." : "Valider"}
                    </button>
                    <button onClick={() => setRejectId(rejectId === d.id ? null : d.id)} className="rounded-xl bg-red-500 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-600">
                      Refuser
                    </button>
                  </div>
                </div>
                {d.preuve_path && (
                  <button onClick={() => openPreuve(d.id)} disabled={imageLoading} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-wave-700 transition hover:bg-brand-50 border border-wave-200 w-full disabled:opacity-50">
                    <Eye className="h-4 w-4" /> {imageLoading ? "Chargement..." : "Voir la preuve"}
                  </button>
                )}
                {rejectId === d.id && (
                  <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} className="mt-3 space-y-2">
                    <input className="input text-sm" placeholder="Motif du refus (optionnel)" value={motif} onChange={(e) => setMotif(e.target.value)} />
                    <div className="flex gap-2">
                      <button onClick={() => doRefuser(d.id)} disabled={actionLoading === d.id} className="flex-1 rounded-xl bg-red-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-600 disabled:opacity-50">
                        {actionLoading === d.id ? "..." : "Confirmer le refus"}
                      </button>
                      <button onClick={() => { setRejectId(null); setMotif(""); }} className="rounded-xl bg-wave-100 px-3 py-2 text-xs font-semibold text-wave-600">Annuler</button>
                    </div>
                  </motion.div>
                )}
              </div>
            ))
          )}
        </div>
      </motion.div>

      {imagePreview && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/80 p-4" onClick={closePreview}>
          <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <img src={imagePreview} alt="Preuve de paiement" className="w-full rounded-2xl shadow-2xl" />
            <button onClick={closePreview} className="absolute -top-3 -right-3 grid h-10 w-10 place-items-center rounded-full bg-white shadow-lg text-wave-700">
              <X className="h-5 w-5" />
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function timeAgo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, Math.floor((now - then) / 1000));
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff/60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff/3600)} h`;
  return `il y a ${Math.floor(diff/86400)} j`;
}

function Modal({ title, onClose, children }) {
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
          <h3 className="font-display text-lg font-extrabold">{title}</h3>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-wave-100 text-wave-500 transition hover:bg-wave-50 hover:text-wave-700">✕</button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function DeleteGroupModal({ groupeId, groupeName, onClose }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleDelete() {
    setLoading(true);
    setErr("");
    try {
      await api.delete(`/groupes/${groupeId}`);
      router.push("/app");
    } catch (e) {
      setErr(e.response?.data?.message || "Erreur lors de la suppression.");
      setLoading(false);
    }
  }

  return (
    <Modal title="Supprimer le groupe" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 font-semibold border border-red-100">
          <p>Êtes-vous sûr de vouloir supprimer le groupe <strong>{groupeName}</strong> ?</p>
          <p className="mt-2 text-xs font-normal">Cette action est définitive et irréversible. Elle ne peut être effectuée que si aucun paiement n'a été enregistré.</p>
        </div>
        {err && <motion.p initial={{opacity:0,y:-5}} animate={{opacity:1,y:0}} className="rounded-xl bg-red-100 px-3 py-2 text-sm text-red-700">{err}</motion.p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-ghost flex-1 !py-3">Annuler</button>
          <button onClick={handleDelete} disabled={loading} className="btn-primary flex-1 !py-3 !bg-red-500 hover:!bg-red-600 text-white border-0">
            {loading ? "Suppression..." : "Supprimer"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function ManagerPayModal({ groupeId, membreId, onClose }) {
  const [f, setF] = useState({
    membre_id: membreId || "", type: "cotisation", montant: "", mode: "cash",
    date_paiement: new Date().toISOString().slice(0,10), note: "",
  });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function submit(){
    setErr(""); setLoading(true);
    try {
      await api.post(`/groupes/${groupeId}/paiements`, f);
      setSuccess(true);
      setTimeout(()=>onClose(), 1200);
    } catch(e){ setErr(e.response?.data?.message || "Erreur"); }
    finally { setLoading(false); }
  }

  return (
    <Modal title="Confirmer mon paiement" onClose={onClose}>
      {success ? (
        <motion.div initial={{scale:0.9,opacity:0}} animate={{scale:1,opacity:1}} className="flex flex-col items-center gap-3 py-6">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600"><CheckCircle2 className="h-7 w-7"/></span>
          <p className="font-display text-lg font-bold">Paiement enregistré</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select className="input" value={f.type} onChange={(e)=>setF({...f,type:e.target.value})}>
                <option value="cotisation">Cotisation</option>
                <option value="adhesion">Adhésion</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div>
              <label className="label">Mode</label>
              <select className="input" value={f.mode} onChange={(e)=>setF({...f,mode:e.target.value})}>
                <option value="cash">Cash</option>
                <option value="wave">Mobile Money</option>
                <option value="virement">Virement</option>
                <option value="autre">Autre</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Montant (FCFA)</label>
              <input type="number" min="1" className="input" placeholder="Entrer un montant" value={f.montant} onChange={(e)=>setF({...f,montant:e.target.value?parseInt(e.target.value):""})}/>
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input" value={f.date_paiement} onChange={(e)=>setF({...f,date_paiement:e.target.value})}/>
            </div>
          </div>
          <div>
            <label className="label">Note (optionnel)</label>
            <input className="input" value={f.note} onChange={(e)=>setF({...f,note:e.target.value})}/>
          </div>
          {err && <motion.p initial={{opacity:0,y:-5}} animate={{opacity:1,y:0}} className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{err}</motion.p>}
          <button onClick={submit} disabled={loading || !f.montant} className="btn-primary w-full !py-3">
            {loading?"Enregistrement...":"Enregistrer le paiement"}
          </button>
        </div>
      )}
    </Modal>
  );
}
