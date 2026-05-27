'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export default function PaiementSucces() {
  const router = useRouter();

  useEffect(() => {
    // Redirection automatique vers l'espace membre après 5 secondes
    const timer = setTimeout(() => {
      router.push('/app');
    }, 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 font-sans px-4">
      <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center max-w-md w-full backdrop-blur-xl">
        {/* Icône succès */}
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30">
          <CheckCircle2 className="h-10 w-10 text-white" />
        </div>

        <h1 className="text-slate-100 text-2xl font-bold mb-3">
          Paiement réussi !
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          Votre paiement a été confirmé avec succès. Votre cotisation a bien été enregistrée.
        </p>

        <p className="text-slate-500 text-xs mb-6">
          Vous serez redirigé automatiquement dans quelques secondes…
        </p>

        <Link
          href="/app"
          className="inline-block bg-gradient-to-r from-indigo-500 to-violet-500 text-white no-underline px-7 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 active:scale-95"
        >
          Retour à mon espace
        </Link>
      </div>
    </div>
  );
}
