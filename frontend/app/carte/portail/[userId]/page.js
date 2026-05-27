"use client";
import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Wallet, Users, ChevronRight, ShieldCheck } from "lucide-react";
import { api, fcfa } from "../../../lib/api";

function Inner() {
  const { userId } = useParams();
  const sp = useSearchParams();
  const token = sp.get("token");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get(`/public/gestionnaire/${userId}/portail`, { params: { token } })
      .then(r => setData(r.data))
      .catch(e => setErr(e.response?.data?.message || "Accès refusé"));
  }, [userId, token]);

  return (
    <main className="hero-gradient min-h-screen px-5 py-10">
      <div className="mx-auto max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl wave-bg text-white shadow-soft"><Wallet className="h-5 w-5" /></span>
          <span className="font-display text-xl font-extrabold">CotisPro</span>
        </Link>

        {err && <div className="card text-center"><p className="text-sm text-red-700">{err}</p></div>}

        {data && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="card text-center">
              <div className="flex items-center gap-2 text-xs text-brand-600 justify-center"><ShieldCheck className="h-4 w-4" /> Consultation publique sécurisée</div>
              <h2 className="mt-3 font-display text-2xl font-extrabold text-wave-900">{data.user.nom}</h2>
              <p className="text-sm text-wave-500">Gestionnaire · {data.groupes.length} groupe{data.groupes.length > 1 ? "s" : ""}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-wave-500 px-1">Groupes de cotisation</h3>
              {data.groupes.map((g, i) => (
                <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <Link
                    href={`/carte/portail/${userId}/groupe/${g.id}?token=${token}`}
                    className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-soft ring-1 ring-wave-100 transition hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl wave-bg text-lg font-bold text-white">{g.nom[0]}</span>
                      <div>
                        <p className="font-bold text-wave-900">{g.nom}</p>
                        <p className="text-xs text-wave-500 flex items-center gap-1.5 mt-0.5">
                          <Users className="h-3 w-3" /> {g.membres_count} membre{g.membres_count > 1 ? "s" : ""} · {g.devise}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-wave-300" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}

export default function Page() { return <Suspense fallback={null}><Inner /></Suspense>; }
