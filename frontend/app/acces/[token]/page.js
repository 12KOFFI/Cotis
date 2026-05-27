"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wallet,
  History,
  CreditCard,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { fcfa } from "../../lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

const STATUT = {
  a_jour: {
    t: "À jour",
    c: "bg-emerald-50 text-emerald-600",
    Icon: CheckCircle2,
  },
  partiel: { t: "Paiement partiel", c: "bg-sky-50 text-sky-700", Icon: Clock },
  en_attente: {
    t: "En attente de paiement",
    c: "bg-amber-50 text-amber-700",
    Icon: Clock,
  },
  en_retard: {
    t: "En retard",
    c: "bg-orange-50 text-orange-700",
    Icon: AlertTriangle,
  },
  impaye: { t: "Impayé", c: "bg-red-50 text-red-700", Icon: AlertTriangle },
};

const STATUT_ICON = {
  reussi: { Icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-600" },
  en_attente: { Icon: Clock, cls: "bg-amber-50 text-amber-600" },
  echoue: { Icon: AlertTriangle, cls: "bg-red-50 text-red-600" },
};

export default function AccesMembre() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/acces/${token}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Lien invalide ou expiré");
        return r.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [token]);

  if (loading)
    return (
      <div className="min-h-screen bg-wave-50/40 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-wave-200 border-t-wave-600" />
          <p className="text-sm text-wave-500">Chargement de votre espace...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-wave-50/40 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-red-50">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="font-display text-xl font-bold text-wave-900">
            Lien invalide
          </h1>
          <p className="mt-2 text-sm text-wave-500">
            Ce lien d'accès est invalide ou a expiré. Contactez votre
            gestionnaire pour obtenir un nouveau lien.
          </p>
        </div>
      </div>
    );

  const s = STATUT[data.statut] || STATUT.a_jour;
  const pct =
    data.montant_du > 0
      ? Math.min(100, Math.round((data.montant_verse / data.montant_du) * 100))
      : 100;
  const needsAdhesion = data.adhesion && data.adhesion.statut !== "paye";

  return (
    <div className="min-h-screen bg-wave-50/40 pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-wave-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            {data.groupe.logo ? (
              <img
                src={data.groupe.logo}
                alt={data.groupe.nom}
                className="h-9 w-9 rounded-xl object-cover"
              />
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-xl wave-bg text-white shadow-soft">
                <Wallet className="h-5 w-5" />
              </span>
            )}
            <div>
              <p className="text-[9px] uppercase tracking-widest text-wave-400">
                CotisPro
              </p>
              <h1 className="font-display text-sm font-bold leading-tight text-wave-900">
                {data.groupe.nom}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-wave-50 px-3 py-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-wave-500" />
            <span className="text-[11px] font-semibold text-wave-600">
              Lecture seule
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-5">
        {/* Welcome */}
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full wave-bg text-base font-bold text-white">
            {(data.membre.prenom || data.membre.nom || "?")[0]}
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-wave-400">
              Mon espace
            </p>
            <h2 className="font-display text-lg font-bold text-wave-900">
              {data.membre.full_name}
            </h2>
          </div>
        </div>

        {/* Adhesion alert */}
        {needsAdhesion && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-2xl bg-red-50 p-4 border border-red-200"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <div>
                <p className="text-sm font-bold text-red-700">
                  Frais d'adhésion non réglés
                </p>
                <p className="mt-1 text-xs text-red-600">
                  Montant :{" "}
                  {fcfa(data.adhesion.montant_du - data.adhesion.montant_paye)}
                </p>
                <p className="mt-1 text-xs text-red-500">
                  Contactez votre gestionnaire pour régler l'adhésion.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-3xl wave-bg text-white shadow-soft"
        >
          <div className="p-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/60">
                  Ma cotisation
                </p>
                <p className="mt-0.5 text-sm font-medium text-white/80">
                  {data.periode
                    ? `${fmtDate(data.periode.date_debut)} → ${fmtDate(data.periode.date_fin)}`
                    : "Aucune période active"}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
                <s.Icon className="h-3.5 w-3.5" /> {s.t}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
                <p className="text-[10px] font-semibold text-white/60">
                  Déjà payé
                </p>
                <p className="mt-0.5 font-display text-xl font-extrabold text-white">
                  {fcfa(data.montant_verse)}
                </p>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" /> <span>Versé</span>
                </div>
              </div>
              <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
                <p className="text-[10px] font-semibold text-white/60">
                  Reste à payer
                </p>
                <p className="mt-0.5 font-display text-xl font-extrabold text-white">
                  {fcfa(data.reste_a_payer)}
                </p>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-300">
                  <Clock className="h-3 w-3" />{" "}
                  <span>
                    {data.reste_a_payer > 0 ? "En attente" : "À jour"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full rounded-full bg-white"
                />
              </div>
              <p className="mt-1 text-[11px] text-white/50">
                {fcfa(data.montant_verse)} versés sur {fcfa(data.montant_du)}
              </p>
            </div>
          </div>

          {data.groupe.wave_numero && (
            <div className="border-t border-white/10 px-5 py-3">
              <p className="text-[10px] text-white/50">
                Pour payer, contactez :
              </p>
              <p className="text-sm font-bold">{data.groupe.wave_numero}</p>
            </div>
          )}
        </motion.div>

        {/* Payment History */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-base font-bold text-wave-900 flex items-center gap-2">
              <History className="h-4 w-4 text-wave-500" /> Historique des
              paiements
            </h3>
            {data.paiements.length > 0 && (
              <span className="text-xs text-wave-500">
                {data.paiements.length} paiement
                {data.paiements.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {data.paiements.length === 0 ? (
            <p className="py-12 text-center text-sm text-wave-500">
              Aucun paiement enregistré.
            </p>
          ) : (
            <div className="space-y-2">
              {data.paiements.map((p, idx) => {
                const si = STATUT_ICON[p.statut] || STATUT_ICON.reussi;
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="card flex items-center gap-3"
                  >
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${si.cls}`}
                    >
                      <si.Icon className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold capitalize">
                        {p.type}
                        {p.periode ? ` · ${fmtDate(p.periode.date_debut)}` : ""}
                      </p>
                      <p className="text-[11px] text-wave-400">
                        {fmtDate(p.date_paiement)} · {p.mode}
                      </p>
                    </div>
                    <p
                      className={`shrink-0 text-sm font-bold ${p.statut === "reussi" ? "text-brand-600" : "text-wave-600"}`}
                    >
                      +{fcfa(p.montant)}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-wave-400">
            Propulsé par CotisPro · Accès sécurisé en lecture seule
          </p>
        </div>
      </div>
    </div>
  );
}
