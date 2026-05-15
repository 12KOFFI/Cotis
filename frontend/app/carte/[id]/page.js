"use client";
import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Wallet, ShieldCheck } from "lucide-react";
import { api, fcfa } from "../../lib/api";
import MemberCard from "../../components/MemberCard";

function Inner() {
  const { id } = useParams();
  const sp = useSearchParams();
  const token = sp.get("token");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(()=>{
    api.get(`/public/membre/${id}/history`, { params: { token } })
      .then((r)=>setData(r.data))
      .catch((e)=>setErr(e.response?.data?.message || "Accès refusé"));
  }, [id, token]);

  return (
    <main className="hero-gradient min-h-screen px-5 py-10">
      <div className="mx-auto max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl wave-bg text-white shadow-soft"><Wallet className="h-5 w-5"/></span>
          <span className="font-display text-xl font-extrabold">CotisPro</span>
        </Link>
        {err && <div className="card text-center"><p className="text-sm text-red-700">{err}</p></div>}
        {data && (
          <div className="space-y-6">
            <div className="flex justify-center">
              <MemberCard membre={{ ...data.membre, id }} groupe={data.groupe} />
            </div>
            
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="card">
              <div className="flex items-center gap-2 text-xs text-brand-600"><ShieldCheck className="h-4 w-4"/> Consultation publique sécurisée</div>
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
