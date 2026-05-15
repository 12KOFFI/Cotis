"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Wallet, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, ArrowLeft } from "lucide-react";
import { api, auth } from "../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      auth.setSession(data.token, data.user);
      router.push("/app");
    } catch (err) {
      const msg = err.response?.data?.errors?.email?.[0] || err.response?.data?.message || "Erreur de connexion";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="hero-gradient flex min-h-screen flex-col items-center justify-center px-5 py-10 relative overflow-hidden">
      {/* SVG Décoratif d'Arrière-plan */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <svg className="absolute -top-24 -left-24 w-96 h-96 opacity-10 text-wave-600" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="currentColor" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,88.5,-0.9C87,14.6,81.4,29.2,72.1,40.8C62.8,52.5,49.8,61.1,36.3,68.3C22.8,75.4,8.8,81,-4.5,88.8C-17.8,96.6,-30.5,106.6,-41.2,103.5C-52,100.4,-60.8,84.1,-68.3,70.5C-75.8,56.9,-81.9,46,-85.4,34C-88.9,22.1,-89.8,9,-86.3,-2.1C-82.7,-13.1,-74.7,-22,-66.6,-30.5C-58.4,-39,-50.2,-47.1,-40.4,-56.4C-30.7,-65.7,-19.4,-76.2,-4.7,-68C9.9,-59.8,44.7,-76.4,44.7,-76.4Z" transform="translate(100 100)" />
        </svg>
        <svg className="absolute -bottom-24 -right-24 w-96 h-96 opacity-10 text-brand-600" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="currentColor" d="M38.1,-65.4C50.3,-58.8,61.8,-50,69.7,-38.5C77.6,-27,81.9,-12.8,80.1,0.8C78.4,14.3,70.5,27.2,61.4,38.1C52.2,49,41.9,58,29.9,64.2C18,70.4,4.4,73.8,-9.5,72.6C-23.4,71.4,-37.6,65.5,-49.2,57.1C-60.8,48.7,-69.8,37.8,-74.8,25.3C-79.8,12.8,-80.7,-1.2,-77.8,-14.2C-74.9,-27.2,-68.2,-39.3,-58.3,-46.8C-48.4,-54.3,-35.3,-57.3,-24.1,-64.5C-12.8,-71.7,-3.4,-83.1,8,-75C19.4,-66.9,38.1,-65.4,38.1,-65.4Z" transform="translate(100 100)" />
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="mb-8 flex justify-start">
          <Link href="/" className="group inline-flex items-center gap-2 text-sm font-bold text-wave-700 hover:text-wave-900 bg-white/80 backdrop-blur-md rounded-2xl px-5 py-2.5 border border-wave-200 transition shadow-sm hover:shadow-md">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Retour à l'accueil
          </Link>
        </div>

        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl wave-bg text-white shadow-xl shadow-wave-200">
              <Wallet className="h-7 w-7" />
            </span>
            <span className="font-display text-3xl font-black text-slate-900 tracking-tight">CotisPro</span>
          </Link>
        </div>

        <div className="card !p-8 shadow-2xl shadow-slate-200/60 border border-slate-100">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-black text-slate-900">Bon retour !</h1>
            <p className="mt-2 text-slate-500 font-medium">Entrez vos identifiants pour accéder à votre espace.</p>
          </div>

          <form onSubmit={submit} className="space-y-6">
            <div>
              <label className="label text-xs font-black uppercase tracking-wider text-slate-400 mb-2 block">Adresse E-mail</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-wave-600"/>
                <input type="email" required className="input pl-12 bg-slate-50 border-slate-100 focus:bg-white transition-all h-14 text-base" placeholder="votre@email.com" value={email} onChange={(e)=>setEmail(e.target.value)}/>
              </div>
            </div>
            <div>
              <label className="label text-xs font-black uppercase tracking-wider text-slate-400 mb-2 block">Mot de passe</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-wave-600"/>
                <input type={showPw?"text":"password"} required className="input pl-12 pr-12 bg-slate-50 border-slate-100 focus:bg-white transition-all h-14 text-base" placeholder="••••••••" value={password} onChange={(e)=>setPassword(e.target.value)}/>
                <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors">
                  {showPw ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                </button>
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm font-semibold text-rose-700 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                {error}
              </motion.div>
            )}

            <button type="submit" disabled={loading} className="btn-primary group w-full h-14 text-lg font-black shadow-lg shadow-wave-200 transition-all hover:shadow-xl active:scale-[0.98]">
              {loading ? (
                <span className="flex items-center gap-3">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Connexion...
                </span>
              ) : (
                <>Se connecter <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1"/></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-sm font-medium text-slate-500">
              Nouveau sur CotisPro ? <Link href="/register" className="font-black text-wave-700 hover:text-wave-900 transition-colors">Créer un compte gratuitement</Link>
            </p>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-3">
          <div className="h-px w-8 bg-slate-200" />
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Sécurité 256-bit AES
          </p>
          <div className="h-px w-8 bg-slate-200" />
        </div>
      </motion.div>
    </main>
  );
}
