"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Download, QrCode, ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import AppShell from "../../../../../components/AppShell";
import { api, auth, API_BASE } from "../../../../../lib/api";

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
          <div className="relative overflow-hidden rounded-[2rem] wave-bg p-6 text-white shadow-[0_30px_80px_-20px_rgba(14,40,120,0.5)]">
            <div aria-hidden className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div aria-hidden className="absolute -left-6 bottom-10 h-24 w-24 rounded-full bg-white/5 blur-xl" />
            <p className="text-[9px] uppercase tracking-[0.35em] text-white/50">COTISPRO</p>
            <p className="mt-1 font-display text-xl font-extrabold">{data.groupe.nom}</p>
            <div className="mt-6">
              <p className="text-[10px] text-white/50">Membre</p>
              <p className="font-display text-2xl font-bold">{data.membre.prenom} {data.membre.nom}</p>
              <span className="mt-1 inline-block rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold capitalize backdrop-blur">{data.membre.role}</span>
            </div>
            <div className="mt-6 flex items-end justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/50">ID membre</p>
                <p className="font-mono text-sm font-semibold">#{String(data.membre.id).padStart(5, "0")}</p>
              </div>
              <div className="grid h-24 w-24 place-items-center rounded-xl bg-white p-1.5 shadow-soft">
                <img alt="qr" src={`data:image/png;base64,${data.qr_png_base64}`} className="h-full w-full" />
              </div>
            </div>
          </div>
          <button onClick={download} className="btn-primary mt-5 w-full !py-3 text-base">
            <Download className="h-4 w-4" /> Télécharger PDF
          </button>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-wave-400">
            <ShieldCheck className="h-3.5 w-3.5" /> Scannez le QR pour consulter l'historique
          </p>
        </motion.div>
      )}
    </AppShell>
  );
}
