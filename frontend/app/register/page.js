"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Wallet, ArrowRight, User, Mail, Lock, ShieldCheck, ArrowLeft, Users, Eye, EyeOff, XCircle, CheckCircle2 } from "lucide-react";
import { api, auth } from "../lib/api";
import PhoneInput from "../components/PhoneInput";

const EMAIL_DOMAINS = ["@gmail.com", "@yahoo.fr", "@hotmail.com", "@outlook.com", "@yahoo.com"];

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    telephone: "",
    password: "",
    password_confirmation: "",
  });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConf, setShowPasswordConf] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confTouched, setConfTouched] = useState(false);
  const emailRef = useRef(null);

  
  const validatePassword = (val) => {
    const errs = [];
    if (val.length > 0) {
      if (val.length < 8) errs.push("8 caractères minimum");
      if (!/[A-Z]/.test(val) || !/[a-z]/.test(val)) errs.push("Une majuscule et une minuscule");
      if (!/[0-9]/.test(val)) errs.push("Au moins un chiffre");
    }
    setPasswordErrors(errs);
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setForm({ ...form, password: val });
    // Réinitialise l'état d'erreur pendant la saisie (évite le rouge immédiat)
    setPasswordErrors([]);
    setPasswordTouched(false);
  };

  const handlePasswordConfChange = (e) => {
    const val = e.target.value;
    setForm({ ...form, password_confirmation: val });
    // Réinitialise la confirmation pour éviter le rouge immédiat pendant la saisie
    setConfTouched(false);
  };

  // Compute email suggestions based on current input
  const emailSuggestions = (() => {
    const val = form.email.trim();
    if (!val || val.includes("@")) return [];
    return EMAIL_DOMAINS.map((d) => val + d);
  })();

  function selectSuggestion(suggestion) {
    setForm({ ...form, email: suggestion });
    setShowSuggestions(false);
    emailRef.current?.blur();
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (form.password !== form.password_confirmation) {
      setErr("Les mots de passe ne correspondent pas");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", form);
      auth.setSession(data.token, data.user);
      router.push("/app/groupes/new");
    } catch (e) {
      const errors = e.response?.data?.errors;
      setErr(errors ? Object.values(errors).flat().join(". ") : (e.response?.data?.message || "Erreur"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="hero-gradient flex min-h-screen flex-col items-center justify-center px-5 py-10 relative overflow-hidden">
      {/* SVG Décoratif d'Arrière-plan */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <svg className="absolute -top-32 -right-32 w-[30rem] h-[30rem] opacity-[0.08] text-wave-600" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="currentColor" d="M42.1,-71.4C54.8,-63.4,65.6,-52,73.4,-38.7C81.1,-25.4,85.8,-10.2,85.2,4.8C84.7,19.8,78.9,34.5,69.5,46.5C60.1,58.5,47.1,67.8,32.8,74.5C18.5,81.1,2.9,85.1,-11.9,83C-26.7,80.9,-40.7,72.7,-52.7,62.6C-64.7,52.5,-74.6,40.5,-79.8,26.7C-85,12.9,-85.4,-2.7,-82,-17C-78.6,-31.3,-71.3,-44.3,-60.1,-52.7C-48.9,-61.1,-33.8,-64.8,-19.9,-71.7C-6.1,-78.6,6.5,-88.7,19.3,-84.9C32.1,-81.1,42.1,-71.4,42.1,-71.4Z" transform="translate(100 100)" />
        </svg>
        <svg className="absolute -bottom-32 -left-32 w-[30rem] h-[30rem] opacity-[0.08] text-brand-600" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="currentColor" d="M48.2,-78.3C62.1,-71.5,72.8,-57.8,79.5,-42.6C86.1,-27.4,88.7,-10.8,88.4,5.9C88.1,22.6,84.9,39.4,75.4,52.4C65.8,65.4,49.9,74.5,33.5,79.5C17.1,84.5,0.2,85.4,-15.8,82.3C-31.8,79.2,-46.8,72.1,-58.5,61.4C-70.2,50.7,-78.6,36.5,-83.1,21.1C-87.7,5.6,-88.4,-11.1,-84.3,-26.1C-80.1,-41,-71.1,-54.2,-58.8,-62C-46.5,-69.8,-31,-72.1,-16.4,-77.8C-1.8,-83.4,12.1,-92.4,26.6,-88.9C41.1,-85.4,48.2,-78.3,48.2,-78.3Z" transform="translate(100 100)" />
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg"
      >
        <div className="mb-6 flex justify-start">
          <Link href="/" className="group inline-flex items-center gap-2 text-sm font-bold text-wave-700 hover:text-wave-900 bg-white/80 backdrop-blur-md rounded-2xl px-5 py-2.5 border border-wave-200 transition shadow-sm hover:shadow-md">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Retour
          </Link>
        </div>

        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl wave-bg text-white shadow-xl">
              <Wallet className="h-7 w-7" />
            </span>
            <span className="font-display text-3xl font-black text-slate-900 tracking-tight">CotisPro</span>
          </Link>
        </div>

        <div className="card !p-8 shadow-2xl shadow-slate-200/60 border border-slate-100">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-black text-slate-900">Rejoignez-nous</h1>
            <p className="mt-2 text-slate-500 font-medium">Digitalisez votre tontine ou association en quelques clics.</p>
            
            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-wave-50 border border-wave-100/50 p-4 text-wave-800">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-wave-600 text-white shadow-md shadow-wave-200">
                <Users className="h-4 w-4" />
              </span>
              <p className="text-[11px] font-black uppercase tracking-wider text-wave-900 leading-normal">
                JE SUIS UNE ASSOCIATION ET SOUHAITE CRÉER MON COMPTE GRATUITEMENT
              </p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="label text-xs font-black uppercase tracking-wider text-slate-400 mb-2 block">Prénom & Nom</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300 group-focus-within:text-wave-600 transition-colors" />
                  <input className="input pl-12 bg-slate-50 border-slate-100 h-14" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Aminata Diallo" />
                </div>
              </div>
              <div className="relative">
                <label className="label text-xs font-black uppercase tracking-wider text-slate-400 mb-2 block">Adresse E-mail</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300 group-focus-within:text-wave-600 transition-colors z-10" />
                  <input
                    ref={emailRef}
                    type="email"
                    required
                    className="input pl-12 bg-slate-50 border-slate-100 h-14"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="vous@gmail.com"
                  />
                  {/* Email domain suggestions */}
                  {showSuggestions && emailSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-2xl bg-white shadow-xl ring-1 ring-wave-100 border border-wave-100 overflow-hidden">
                      {emailSuggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s); }}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition hover:bg-wave-50"
                        >
                          <Mail className="h-3.5 w-3.5 text-wave-400 shrink-0" />
                          <span className="text-wave-900 font-medium truncate">{s}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <label className="label text-xs font-black uppercase tracking-wider text-slate-400 mb-2 block">Numéro de Téléphone</label>
              <PhoneInput
                value={form.telephone}
                onChange={(val) => setForm({ ...form, telephone: val })}
                defaultCountry="CI"
                large
              />
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="label text-xs font-black uppercase tracking-wider text-slate-400 mb-2 block">Mot de passe</label>
                <div className="relative group">
                  <Lock className={`absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transition-colors ${passwordTouched && passwordErrors.length > 0 ? 'text-rose-500' : 'text-slate-300 group-focus-within:text-wave-600'}`} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    className={`input pl-12 pr-12 h-14 transition-colors ${passwordTouched && passwordErrors.length > 0 ? 'bg-rose-50 border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500/20' : 'bg-slate-50 border-slate-100'}`}
                    value={form.password} 
                    onChange={handlePasswordChange} 
                    onBlur={() => {
                      setPasswordTouched(true);
                      validatePassword(form.password);
                    }}
                    placeholder="••••••••" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {/* Facebook style validation feedback */}
                {passwordTouched && form.password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {passwordErrors.length > 0 ? (
                      passwordErrors.map((err, i) => (
                        <p key={i} className="flex items-center gap-1.5 text-xs font-medium text-rose-600">
                          <XCircle className="h-3.5 w-3.5" /> {err}
                        </p>
                      ))
                    ) : (
                      <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Mot de passe robuste
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              <div>
                <label className="label text-xs font-black uppercase tracking-wider text-slate-400 mb-2 block">Confirmation</label>
                <div className="relative group">
                  <Lock className={`absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transition-colors ${confTouched && form.password_confirmation && form.password !== form.password_confirmation ? 'text-rose-500' : 'text-slate-300 group-focus-within:text-wave-600'}`} />
                  <input 
                    type={showPasswordConf ? "text" : "password"} 
                    required 
                    className={`input pl-12 pr-12 h-14 transition-colors ${confTouched && form.password_confirmation && form.password !== form.password_confirmation ? 'bg-rose-50 border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500/20' : 'bg-slate-50 border-slate-100'}`}
                    value={form.password_confirmation} 
                    onChange={handlePasswordConfChange} 
                    onBlur={() => setConfTouched(true)}
                    placeholder="••••••••" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPasswordConf(!showPasswordConf)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPasswordConf ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {confTouched && form.password_confirmation && form.password !== form.password_confirmation && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rose-600">
                    <XCircle className="h-3.5 w-3.5" /> Les mots de passe ne correspondent pas
                  </p>
                )}
              </div>
            </div>

            {err && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm font-semibold text-rose-700">
                {err}
              </motion.div>
            )}

            <button disabled={loading} className="btn-primary group w-full h-14 text-lg font-black shadow-lg shadow-wave-200 transition-all hover:shadow-xl active:scale-[0.98]">
              {loading ? (
                <span className="flex items-center gap-3">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Inscription...
                </span>
              ) : (<>Créer mon compte <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></>)}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center">
            <p className="text-sm font-medium text-slate-500">
              Vous avez déjà un compte ? <Link href="/login" className="font-black text-wave-700 hover:text-wave-900 transition-colors">Se connecter</Link>
            </p>
          </div>
        </div>

        <div className="mt-10 text-center">
           <p className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Inscription 100% sécurisée
          </p>
        </div>
      </motion.div>
    </main>
  );
}
