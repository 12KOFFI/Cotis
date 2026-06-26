'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { XCircle } from 'lucide-react';

export default function PaiementErreur() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(8);
  const [redirectUrl, setRedirectUrl] = useState('/app');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Récupérer le dernier groupe visité pour rediriger vers l'espace membre
    const lastGroupeId = localStorage.getItem('cp_last_groupe');
    const url = lastGroupeId ? `/app/m/${lastGroupeId}` : '/app';
    setRedirectUrl(url);
    setMounted(true);

    // Redirection automatique après le compte à rebours
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push(url);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [router]);

  if (!mounted) return null; // Évite l'erreur d'hydratation

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 font-sans px-4">
      <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center max-w-md w-full backdrop-blur-xl">
        {/* Icône erreur */}
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/30">
          <XCircle className="h-10 w-10 text-white" />
        </div>

        <h1 className="text-slate-100 text-2xl font-bold mb-3">
          Paiement échoué
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          Votre paiement n'a pas pu être traité ou a été annulé. Aucun montant n'a été débité.
        </p>

        <p className="text-slate-500 text-xs mb-6">
          Redirection automatique dans {countdown} seconde{countdown > 1 ? 's' : ''}…
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href={redirectUrl}
            className="inline-block bg-gradient-to-r from-indigo-500 to-violet-500 text-white no-underline px-6 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 active:scale-95"
          >
            Réessayer
          </Link>

          <Link
            href={redirectUrl}
            className="inline-block bg-white/10 text-slate-400 no-underline px-6 py-3 rounded-xl font-semibold text-sm border border-white/10 transition-opacity hover:opacity-90 active:scale-95"
          >
            Mon espace
          </Link>
        </div>
      </div>
    </div>
  );
}
