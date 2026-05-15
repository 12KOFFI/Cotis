"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Wallet, ArrowRight, ShieldCheck } from "lucide-react";
import { api, auth } from "../lib/api";

function InvitationInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const [inv, setInv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ nom: "", prenom: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setErr("Token manquant"); setLoading(false); return; }
    api.get(`/invitations/${token}`)
      .then((r) => setInv(r.data.invitation))
      .catch((e) => setErr(e.response?.data?.message || "Invitation introuvable"))
      .finally(() => setLoading(false));
  }, [token]);

  async function accept(e) {
    e?.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post("/auth/accept-invitation", { token, ...form });
      auth.setSession(data.token, data.user);
      router.push("/app");
    } catch (e) {
      setErr(e.response?.data?.message || "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="hero-gradient grid min-h-screen place-items-center px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl wave-bg text-white shadow-soft">
            <Wallet className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-extrabold">CotisPro</span>
        </Link>
        <div className="card">
          {loading ? (
            <p className="text-center text-sm text-wave-600">Vérification de l'invitation...</p>
          ) : err ? (
            <div className="text-center">
              <h1 className="font-display text-xl font-extrabold text-red-600">Oups</h1>
              <p className="mt-2 text-sm text-wave-600">{err}</p>
              <Link href="/" className="btn-ghost mt-6">Retour</Link>
            </div>
          ) : inv?.statut === "expiree" ? (
            <div className="text-center">
              <h1 className="font-display text-xl font-extrabold">Invitation expirée</h1>
              <p className="mt-2 text-sm text-wave-600">Demandez un nouveau lien à votre gestionnaire.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs text-brand-600"><ShieldCheck className="h-4 w-4" /> Lien sécurisé</div>
              <h1 className="mt-2 font-display text-2xl font-extrabold">Bienvenue !</h1>
              <p className="mt-1 text-sm text-wave-600">
                Vous êtes invité(e) à rejoindre <strong>{inv?.groupe?.nom}</strong>.
              </p>
              <form onSubmit={accept} className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Prénom</label>
                    <input className="input" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} placeholder="Aminata" />
                  </div>
                  <div>
                    <label className="label">Nom</label>
                    <input className="input" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Diallo" />
                  </div>
                </div>
                <button disabled={submitting} className="btn-primary w-full">
                  {submitting ? "..." : (<>Rejoindre le groupe <ArrowRight className="h-4 w-4" /></>)}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </main>
  );
}

export default function InvitationPage() {
  return (
    <Suspense fallback={null}>
      <InvitationInner />
    </Suspense>
  );
}
