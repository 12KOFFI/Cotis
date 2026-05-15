"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Plus, Calendar, Trash2 } from "lucide-react";
import AppShell from "../../../components/AppShell";
import { api } from "../../../lib/api";

const TYPES = [
  { v: "tontine", t: "Tontine", d: "Rotation d'épargne entre membres" },
  { v: "cooperative", t: "Coopérative", d: "Épargne collective, projets communs" },
  { v: "association", t: "Association", d: "Cotisations sociales, solidarité" },
  { v: "autre", t: "Autre", d: "Personnalisé" },
];

const FREQS = [
  { v: "hebdomadaire", t: "Hebdomadaire" },
  { v: "mensuelle", t: "Mensuelle" },
  { v: "trimestrielle", t: "Trimestrielle" },
  { v: "annuelle", t: "Annuelle" },
  { v: "autre", t: "Autre (dates personnalisées)" },
];

export default function NewGroupe() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState({
    nom: "",
    type: "tontine",
    description: "",
    adhesion_active: false,
    adhesion_montant: 0,
    frequence: "mensuelle",
    dates_autres: [],
    montant_standard: 10000,
    montant_personnalisable: false,
    date_debut: new Date().toISOString().slice(0, 10),
    wave_numero: "",
    wave_pays: "CI",
  });

  function upd(k, v) { setF((p) => ({ ...p, [k]: v })); }

  async function submit() {
    setErr(""); setLoading(true);
    try {
      const { data } = await api.post("/groupes", f);
      router.push(`/app/g/${data.groupe.id}?welcome=1`);
    } catch (e) {
      const errors = e.response?.data?.errors;
      setErr(errors ? Object.values(errors).flat().join(". ") : (e.response?.data?.message || "Erreur"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell title="Créer un groupe" back>
      <div className="mb-6 flex items-center gap-1">
        {[1, 2, 3].map((n) => {
          const labels = ["Infos", "Cotisations", "Paiement"];
          return (
            <div key={n} className={`flex flex-1 items-center gap-1.5 ${n <= step ? "" : "opacity-40"}`}>
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold transition ${n < step ? "bg-brand-500 text-white" : n === step ? "wave-bg text-white" : "bg-wave-100 text-wave-500"}`}>
                {n < step ? <Check className="h-4 w-4"/> : n}
              </span>
              <span className="text-[10px] font-semibold text-wave-600 sm:text-xs">
                {labels[n-1]}
              </span>
              {n < 3 && <span className={`h-0.5 flex-1 rounded-full transition ${n < step ? "bg-brand-500" : "bg-wave-100"}`} />}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key={1} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="card space-y-5">
            <div>
              <label className="label">Nom du groupe</label>
              <input className="input" value={f.nom} onChange={(e)=>upd("nom",e.target.value)} placeholder="Ex: Les Sœurs Unies"/>
            </div>
            <div>
              <label className="label">Type</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TYPES.map((t)=>(
                  <button key={t.v} type="button" onClick={()=>upd("type",t.v)} className={`rounded-2xl border p-3 text-left transition ${f.type===t.v?"border-wave-600 bg-wave-50":"border-wave-100 hover:border-wave-300"}`}>
                    <p className="text-sm font-bold">{t.t}</p>
                    <p className="mt-1 text-[11px] text-wave-600">{t.d}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Description (optionnel)</label>
              <textarea rows={3} className="input" value={f.description} onChange={(e)=>upd("description",e.target.value)} placeholder="Objet, règles internes..."/>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-wave-100 p-4">
              <div>
                <p className="text-sm font-semibold">Droit d'adhésion</p>
                <p className="text-xs text-wave-600">Frais unique à l'entrée dans le groupe</p>
              </div>
              <button type="button" onClick={()=>upd("adhesion_active",!f.adhesion_active)} className={`relative h-7 w-12 rounded-full transition ${f.adhesion_active?"bg-brand-500":"bg-wave-100"}`}>
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${f.adhesion_active?"left-6":"left-1"}`}/>
              </button>
            </div>
            {f.adhesion_active && (
              <div>
                <label className="label">Montant d'adhésion (FCFA)</label>
                <input type="number" min="0" className="input" value={f.adhesion_montant} onChange={(e)=>upd("adhesion_montant",parseInt(e.target.value)||0)}/>
              </div>
            )}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key={2} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="card space-y-5">
            <div>
              <label className="label">Fréquence de cotisation</label>
              <div className="grid gap-2">
                {FREQS.map((fq)=>(
                  <button key={fq.v} type="button" onClick={()=>upd("frequence",fq.v)} className={`rounded-2xl border p-3 text-left transition ${f.frequence===fq.v?"border-wave-600 bg-wave-50":"border-wave-100 hover:border-wave-300"}`}>
                    <p className="text-sm font-semibold">{fq.t}</p>
                  </button>
                ))}
              </div>
            </div>
            {f.frequence === "autre" && (
              <div>
                <label className="label">Dates personnalisées</label>
                <div className="space-y-2">
                  {(f.dates_autres||[]).map((d,i)=>(
                    <div key={i} className="flex items-center gap-2">
                      <input type="date" className="input" value={d} onChange={(e)=>{
                        const arr = [...f.dates_autres]; arr[i]=e.target.value; upd("dates_autres",arr);
                      }}/>
                      <button type="button" onClick={()=>upd("dates_autres",f.dates_autres.filter((_,j)=>j!==i))} className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-red-600"><Trash2 className="h-4 w-4"/></button>
                    </div>
                  ))}
                  <button type="button" onClick={()=>upd("dates_autres",[...(f.dates_autres||[]),""])} className="btn-ghost w-full"><Plus className="h-4 w-4"/> Ajouter une date</button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Montant standard (FCFA)</label>
                <input type="number" min="0" className="input" value={f.montant_standard} onChange={(e)=>upd("montant_standard",parseInt(e.target.value)||0)}/>
              </div>
              <div>
                <label className="label">Date de début</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-wave-400"/>
                  <input type="date" className="input pl-10" value={f.date_debut} onChange={(e)=>upd("date_debut",e.target.value)}/>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-wave-100 p-4">
              <div>
                <p className="text-sm font-semibold">Montants personnalisables</p>
                <p className="text-xs text-wave-600">Autoriser un montant différent par membre</p>
              </div>
              <button type="button" onClick={()=>upd("montant_personnalisable",!f.montant_personnalisable)} className={`relative h-7 w-12 rounded-full transition ${f.montant_personnalisable?"bg-brand-500":"bg-wave-100"}`}>
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${f.montant_personnalisable?"left-6":"left-1"}`}/>
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key={3} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} className="card space-y-5">
            <div>
              <p className="text-sm font-semibold">Configurer Wave (optionnel)</p>
              <p className="mt-1 text-xs text-wave-600">Les membres pourront payer via Wave vers votre numéro.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Pays</label>
                <select className="input" value={f.wave_pays} onChange={(e)=>upd("wave_pays",e.target.value)}>
                  <option value="CI">Côte d'Ivoire</option>
                  <option value="SN">Sénégal</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Numéro Wave</label>
                <input className="input" value={f.wave_numero} onChange={(e)=>upd("wave_numero",e.target.value)} placeholder="+225 ..."/>
              </div>
            </div>
            <div className="rounded-2xl bg-wave-50/60 p-4 text-xs text-wave-700">
              <p className="font-semibold">Récapitulatif</p>
              <ul className="mt-2 space-y-1">
                <li>• {f.nom} · <span className="capitalize">{f.type}</span></li>
                <li>• {f.frequence} · {new Intl.NumberFormat("fr-FR").format(f.montant_standard)} FCFA</li>
                {f.adhesion_active && <li>• Adhésion : {new Intl.NumberFormat("fr-FR").format(f.adhesion_montant)} FCFA</li>}
              </ul>
            </div>
            {err && <motion.p initial={{opacity:0,y:-5}} animate={{opacity:1,y:0}} className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{err}</motion.p>}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 flex justify-between gap-3">
        <button onClick={()=>setStep((s)=>Math.max(1,s-1))} disabled={step===1} className="btn-ghost !py-3 disabled:opacity-40">
          <ArrowLeft className="h-4 w-4"/> Retour
        </button>
        {step < 3 ? (
          <button onClick={()=>setStep((s)=>Math.min(3,s+1))} disabled={step===1 && !f.nom} className="btn-primary !py-3">
            Continuer <ArrowRight className="h-4 w-4"/>
          </button>
        ) : (
          <button onClick={submit} disabled={loading} className="btn-primary !py-3">
            {loading ? "Création en cours..." : (<>Créer le groupe <Check className="h-4 w-4"/></>)}
          </button>
        )}
      </div>
    </AppShell>
  );
}
