"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import { Download, Printer, ShieldCheck, Users, Wallet, Mail, Phone } from "lucide-react";
import { api, auth, API_BASE } from "../../lib/api";
import AppShell from "../../components/AppShell";

export default function ProfilPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [qr, setQr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = auth.getUser();
    if (!u) { router.push("/login"); return; }

    api.get("/carte/profil").then((r) => {
      setData(r.data);
      QRCode.toDataURL(r.data.qr_url, {
        width: 140, margin: 1,
        color: { dark: "#0f172a", light: "#ffffff" },
      }).then(setQr);
    }).finally(() => setLoading(false));
  }, [router]);

  function downloadPdf() {
    const token = auth.getToken();
    fetch(`${API_BASE}/carte/profil/pdf`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.blob()).then(b => {
      const u = URL.createObjectURL(b);
      const a = document.createElement("a");
      a.href = u; a.download = "carte-membre.pdf"; a.click();
      URL.revokeObjectURL(u);
    });
  }

  if (loading) return (
    <AppShell title="Mon Profil" back>
      <div className="mx-auto max-w-sm space-y-4">
        <div className="h-72 animate-pulse rounded-[2rem] bg-wave-100/60" />
        <div className="h-12 animate-pulse rounded-full bg-wave-100/60" />
      </div>
    </AppShell>
  );

  return (
    <AppShell title="Mon Profil" back>
      <div className="mx-auto max-w-sm">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center">
        {/* The Card */}
        <div className="relative w-full max-w-[340px] overflow-hidden rounded-3xl bg-[#1e40af] p-6 text-white shadow-2xl">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600" />
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-blue-400/20 blur-3xl" />

          <div className="relative z-10 flex items-center justify-between mb-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-wave-300">Carte Membre</p>
              <h3 className="font-display text-lg font-extrabold leading-tight text-white">Profil Unifié</h3>
            </div>
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
              <ShieldCheck className="h-5 w-5 text-brand-300" />
            </div>
          </div>

          <div className="relative z-10 flex items-end justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-wave-300 uppercase tracking-wider mb-1">Membre</p>
              <p className="font-display text-xl font-bold truncate leading-none">{data?.user?.nom}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {data?.groupes?.map(g => (
                  <span key={g.id} className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold backdrop-blur">
                    <Users className="h-2.5 w-2.5" /> {g.nom}
                  </span>
                ))}
              </div>
            </div>
            {qr && (
              <div className="shrink-0 rounded-xl bg-white p-2 shadow-inner">
                <img src={qr} alt="QR Code" className="h-16 w-16" />
              </div>
            )}
          </div>

          <div className="relative z-10 mt-6 border-t border-white/10 pt-3 flex justify-between items-center">
            <p className="text-[9px] text-wave-400">Scanner pour voir l'historique</p>
            <p className="font-display text-[10px] font-bold tracking-widest text-white/50">CotisPro</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3 w-full max-w-[340px]">
          <button onClick={downloadPdf} className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-wave-100 py-3 text-sm font-semibold text-wave-800 transition hover:bg-wave-200">
            <Download className="h-4 w-4" /> Télécharger
          </button>
          <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-wave-100 py-3 text-sm font-semibold text-wave-800 transition hover:bg-wave-200">
            <Printer className="h-4 w-4" /> Imprimer
          </button>
        </div>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-wave-400 text-center">
          <ShieldCheck className="h-3.5 w-3.5" /> Scannez le QR pour voir l'historique de paiements de tous vos groupes
        </p>

        {/* Groupes liés */}
        <div className="mt-8 w-full max-w-[340px]">
          <h3 className="text-sm font-bold text-wave-900 mb-3">Mes associations ({data?.groupes?.length || 0})</h3>
          <div className="space-y-2">
            {data?.groupes?.map(g => (
              <Link key={g.id} href={`/app/m/${g.id}`} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-soft ring-1 ring-wave-100 transition hover:-translate-y-0.5">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl wave-bg text-sm font-bold text-white">{g.nom[0]}</span>
                  <div>
                    <p className="text-sm font-bold text-wave-900">{g.nom}</p>
                    <p className="text-[11px] text-wave-500">{g.devise}</p>
                  </div>
                </div>
                <Wallet className="h-4 w-4 text-wave-400" />
              </Link>
            ))}
            {(!data?.groupes || data.groupes.length === 0) && (
              <div className="text-center py-6">
                <p className="text-sm text-wave-500">Vous n'êtes membre d'aucun groupe.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
    </AppShell>
  );
}
