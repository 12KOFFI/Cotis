"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import AppShell from "../../../../../components/AppShell";
import { api, auth, API_BASE } from "../../../../../lib/api";
import MemberCard from "../../../../../components/MemberCard";

export default function MembreCarte() {
  const { id, membreId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.get(`/groupes/${id}/membres/${membreId}/carte`)
      .then((r) => { setData(r.data); setLoading(false); })
      .catch((e) => { setErr(e.response?.data?.message || "Erreur"); setLoading(false); });
  }, [id, membreId]);

  function download() {
    const token = auth.getToken();
    fetch(`${API_BASE}/groupes/${id}/membres/${membreId}/carte/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((b) => {
        const u = URL.createObjectURL(b);
        const a = document.createElement("a");
        a.href = u;
        a.download = `carte-${data?.membre?.prenom || ""}-${data?.membre?.nom || ""}.pdf`;
        a.click();
        URL.revokeObjectURL(u);
      });
  }

  return (
    <AppShell title="Carte membre" groupeId={id} back>
      {loading ? (
        <div className="mx-auto max-w-sm space-y-4">
          <div className="h-72 animate-pulse rounded-[2rem] bg-wave-100/60" />
          <div className="h-12 animate-pulse rounded-full bg-wave-100/60" />
        </div>
      ) : err ? (
        <div className="py-16 text-center">
          <p className="text-sm text-red-600">{err}</p>
          <Link href={`/app/g/${id}/membres`} className="btn-ghost mt-4 inline-flex"><ArrowLeft className="h-4 w-4" /> Retour</Link>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mx-auto max-w-sm">
          <div className="flex justify-center">
            <MemberCard 
              membre={{...data.membre, public_token: data.public_token || undefined}} 
              groupe={data.groupe} 
              onDownload={download}
              onPrint={() => window.print()}
            />
          </div>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-wave-400">
            <ShieldCheck className="h-3.5 w-3.5" /> Scannez le QR pour consulter l'historique
          </p>
        </motion.div>
      )}
    </AppShell>
  );
}
