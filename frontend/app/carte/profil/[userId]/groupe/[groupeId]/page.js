"use client";
import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Wallet, ShieldCheck, ChevronLeft } from "lucide-react";
import { api, fcfa } from "../../../../../lib/api";

function Inner() {
  const { userId, groupeId } = useParams();
  const sp = useSearchParams();
  const token = sp.get("token");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(()=>{
    api.get(`/public/profil/${userId}/groupes/${groupeId}/paiements`, { params: { token } })
      .then((r)=>setData(r.data))
      .catch((e)=>setErr(e.response?.data?.message || "Accès refusé"));
  }, [userId, groupeId, token]);

  return (
    <main className="hero-gradient min-h-screen px-5 py-10">
      <div className="mx-auto max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl wave-bg text-white shadow-soft"><Wallet className="h-5 w-5"/></span>
          <span className="font-display text-xl font-extrabold">CotisPro</span>
        </Link>
        
        <Link href={`/carte/profil/${userId}?token=${token}`} className="inline-flex items-center gap-1 text-xs font-bold text-wave-600 hover:text-wave-900 mb-6 bg-white/50 px-3 py-1.5 rounded-full backdrop-blur">
          <ChevronLeft className="h-4 w-4" /> Retour aux associations
        </Link>

        {err && <div className="card text-center"><p className="text-sm text-red-700">{err}</p></div>}
        
        {data && (
          <div className="space-y-6">
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="card">
              <div className="flex items-center gap-2 text-xs text-brand-600"><ShieldCheck className="h-4 w-4"/> Consultation publique sécurisée</div>
              <h2 className="mt-3 font-display text-xl font-extrabold text-wave-900">{data.membre.nom} {data.membre.prenom}</h2>
              <p className="text-sm text-wave-500">Membre · {data.groupe.nom}</p>
              
              <div className="mt-5 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-wave-500">Historique des paiements</h3>
                {data.paiements.length === 0 ? (
                  <p className="py-6 text-center text-sm text-wave-500">Aucun paiement.</p>
                ) : data.paiements.map(p=>(
                  <div key={p.id} className="flex items-center justify-between rounded-2xl bg-wave-50/60 px-3 py-2 text-sm">
                    <div>
                      <p className="font-semibold capitalize">{p.type}</p>
                      <p className="text-[10px] text-wave-500">{p.date_paiement} · {p.mode}</p>
                    </div>
                    <span className="font-bold text-brand-600">+{fcfa(p.montant)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </main>
  );
}
export default function Page(){ return <Suspense fallback={null}><Inner/></Suspense>; }
