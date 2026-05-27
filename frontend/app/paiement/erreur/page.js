'use client';

import Link from 'next/link';
import { XCircle } from 'lucide-react';

export default function PaiementErreur() {
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

        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/app"
            className="inline-block bg-gradient-to-r from-indigo-500 to-violet-500 text-white no-underline px-6 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 active:scale-95"
          >
            Réessayer
          </Link>

          <Link
            href="/app"
            className="inline-block bg-white/10 text-slate-400 no-underline px-6 py-3 rounded-xl font-semibold text-sm border border-white/10 transition-opacity hover:opacity-90 active:scale-95"
          >
            Mon espace
          </Link>
        </div>
      </div>
    </div>
  );
}
