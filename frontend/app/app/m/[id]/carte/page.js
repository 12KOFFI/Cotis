"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Download, QrCode, ShieldCheck } from "lucide-react";
import AppShell from "../../../../components/AppShell";
import { api, auth, API_BASE } from "../../../../lib/api";
import MemberCard from "../../../../components/MemberCard";

export default function MaCarte() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    if (!id || id === 'undefined') return;
    // Trouver le membre_id via mon-dashboard, puis la carte
    api.get(`/groupes/${id}/mon-dashboard`).then(async (r)=>{
      const membreId = r.data.membre.id;
      const c = await api.get(`/groupes/${id}/membres/${membreId}/carte`);
      setData({ ...c.data, membre_id: membreId }); setLoading(false);
    });
  }, [id]);

  function download() {
    const token = auth.getToken();
    fetch(`${API_BASE}/groupes/${id}/membres/${data.membre_id}/carte/pdf`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r=>r.blob()).then(b=>{
      const u = URL.createObjectURL(b);
      const a = document.createElement("a");
      a.href = u; a.download = `carte.pdf`; a.click();
      URL.revokeObjectURL(u);
    });
  }

  return (
    <AppShell title="Ma carte" role="membre" groupeId={id} back>
      {loading ? (
        <div className="mx-auto max-w-sm space-y-4">
          <div className="h-72 animate-pulse rounded-[2rem] bg-wave-100/60"/>
          <div className="h-12 animate-pulse rounded-full bg-wave-100/60"/>
        </div>
      ) : (
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.5}} className="mx-auto max-w-sm">
          <div className="flex justify-center">
            <MemberCard 
              membre={{...data.membre, id: data.membre_id, public_token: data.public_token || undefined}} 
              groupe={data.groupe} 
              onDownload={download}
              onPrint={() => window.print()}
            />
          </div>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-wave-400"><ShieldCheck className="h-3.5 w-3.5"/> Scannez le QR pour consulter l'historique</p>
        </motion.div>
      )}
    </AppShell>
  );
}
