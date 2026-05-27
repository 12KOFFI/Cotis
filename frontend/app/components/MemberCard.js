"use client";
import { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import { ShieldCheck, Download, Printer } from "lucide-react";
import { motion } from "framer-motion";

export default function MemberCard({ membre, groupe, onDownload, onPrint }) {
  const [qrCodeData, setQrCodeData] = useState("");
  const cardRef = useRef(null);

  useEffect(() => {
    if (!membre?.public_token && !membre?.id) return;
    // Build public URL
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    // If we're on the public page, membre doesn't have public_token but we already know we're on the right page, so we could just use the current URL.
    // However, when used in profile, we have public_token.
    const token = membre.public_token || new URLSearchParams(window.location.search).get("token");
    const url = `${origin}/carte/${membre.id}?token=${token}`;

    QRCode.toDataURL(url, {
      width: 120,
      margin: 1,
      color: {
        dark: "#0f172a", // slate-900
        light: "#ffffff",
      },
    }).then(setQrCodeData).catch(console.error);
  }, [membre]);

  return (
    <div className="flex flex-col items-center">
      {/* The Card */}
      <motion.div 
        ref={cardRef}
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-[340px] overflow-hidden rounded-3xl wave-bg p-6 text-white shadow-xl shadow-brand-500/20 print:shadow-none print:break-inside-avoid"
      >
        {/* Abstract background shapes */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-brand-400/20 blur-2xl" />
        
        <div className="relative z-10 flex items-center justify-between mb-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">Carte Membre</p>
            <h3 className="font-display text-lg font-extrabold leading-tight text-white">{groupe?.nom}</h3>
          </div>
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
        </div>

        <div className="relative z-10 flex items-end justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/60 uppercase tracking-wider mb-1">Titulaire</p>
            <p className="font-display text-xl font-bold truncate leading-none mb-1">
              {membre?.prenom} {membre?.nom}
            </p>
            <span className="inline-block mt-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold capitalize backdrop-blur">
              {membre?.role === 'gestionnaire' ? 'Administrateur' : (membre?.role === 'tresorier' ? 'Trésorier' : 'Membre')}
            </span>
          </div>
          
          {qrCodeData && (
            <div className="shrink-0 rounded-2xl bg-white p-2 shadow-inner">
              <img src={qrCodeData} alt="QR Code" className="h-16 w-16" />
            </div>
          )}
        </div>
        
        {/* Subdued footer with branding */}
        <div className="relative z-10 mt-6 border-t border-white/10 pt-3 flex justify-between items-center">
          <p className="text-[9px] text-white/50">Scanner pour vérifier l'authenticité</p>
          <p className="font-display text-[10px] font-bold tracking-widest text-white/50">CotisPro</p>
        </div>
      </motion.div>

      {/* Action Buttons */}
      {(onDownload || onPrint) && (
        <div className="mt-6 flex gap-3 w-full max-w-[340px] print:hidden">
          {onDownload && (
            <button 
              onClick={onDownload} 
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-wave-50 border border-wave-100 py-3.5 text-sm font-bold text-wave-800 transition hover:bg-wave-100 active:scale-95"
            >
              <Download className="h-4.5 w-4.5" /> Télécharger
            </button>
          )}
          {onPrint && (
            <button 
              onClick={onPrint} 
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-wave-50 border border-wave-100 py-3.5 text-sm font-bold text-wave-800 transition hover:bg-wave-100 active:scale-95"
            >
              <Printer className="h-4.5 w-4.5" /> Imprimer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
