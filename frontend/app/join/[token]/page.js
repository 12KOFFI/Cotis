"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail, Phone, Users, Wallet } from "lucide-react";
import { api, auth } from "../../lib/api";

const countries = [
  { code: "CI", label: "Côte d'Ivoire", dial: "+225", flag: "🇨🇮" },
  { code: "SN", label: "Sénégal", dial: "+221", flag: "🇸🇳" },
  { code: "ML", label: "Mali", dial: "+223", flag: "🇲🇱" },
  { code: "BF", label: "Burkina Faso", dial: "+226", flag: "🇧🇫" },
  { code: "GN", label: "Guinée", dial: "+224", flag: "🇬🇳" },
  { code: "BJ", label: "Bénin", dial: "+229", flag: "🇧🇯" },
  { code: "TG", label: "Togo", dial: "+228", flag: "🇹🇬" },
  { code: "CM", label: "Cameroun", dial: "+237", flag: "🇨🇲" },
];

export default function JoinPage() {
  const { token } = useParams();
  const router = useRouter();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ nom: "", prenom: "", telephone: "", email: "", password: "", password_confirmation: "" });
  const [countryCode, setCountryCode] = useState("CI");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [connectedUser] = useState(() => auth.getUser());

  useEffect(() => {
    api.get(`/join/${token}`)
      .then((r) => setInfo(r.data))
      .catch((e) => setError(e.response?.data?.message || "Lien invalide ou expiré"))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (connectedUser) {
      const parts = (connectedUser.name || "").split(" ");
      setForm((f) => ({
        ...f,
        prenom: parts.slice(0, -1).join(" "),
        nom: parts.at(-1) || connectedUser.name || "",
        telephone: connectedUser.telephone || "",
        email: connectedUser.email || "",
      }));
    }
  }, [connectedUser]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!connectedUser && form.password !== form.password_confirmation) {
      setError("Les deux mots de passe ne sont pas identiques.");
      return;
    }
    setJoining(true);
    try {
      const { data } = await api.post(`/join/${token}`, form);
      auth.setSession(data.token, data.user);
      router.push(`/app/m/${data.membre.groupe.id}`);
    } catch (e) {
      const errors = e.response?.data?.errors;
      const first = errors ? Object.values(errors)[0]?.[0] : null;
      setError(first || e.response?.data?.message || "Impossible de rejoindre le groupe");
    } finally {
      setJoining(false);
    }
  }

  function selectCountry(code) {
    const country = countries.find((c) => c.code === code);
    setCountryCode(code);
    if (!country) return;
    setForm((f) => ({
      ...f,
      telephone: !f.telephone || countries.some((c) => f.telephone === c.dial || f.telephone.startsWith(`${c.dial} `))
        ? `${country.dial} `
        : f.telephone,
    }));
  }

  return (
    <main className="hero-gradient flex min-h-screen items-center justify-center px-5 py-10">
      <motion.div initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="grid h-11 w-11 place-items-center rounded-xl wave-bg text-white shadow-soft"><Wallet className="h-6 w-6" /></span>
          <span className="font-display text-2xl font-extrabold text-wave-900">CotisPro</span>
        </Link>

        <div className="card">
          {loading ? (
            <div className="space-y-4">
              <div className="h-6 w-2/3 animate-pulse rounded-full bg-wave-100" />
              <div className="h-32 animate-pulse rounded-3xl bg-wave-100/70" />
            </div>
          ) : error && !info ? (
            <div className="py-6 text-center">
              <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />
              <h1 className="mt-4 font-display text-xl font-extrabold">Lien indisponible</h1>
              <p className="mt-2 text-sm text-wave-500">{error}</p>
              <Link href="/login" className="btn-primary mt-5">Se connecter</Link>
            </div>
          ) : (
            <>
              <div className="mb-5 rounded-3xl bg-wave-50 p-4 text-center">
                <Users className="mx-auto h-8 w-8 text-wave-700" />
                <p className="mt-3 text-xs uppercase tracking-widest text-wave-400">Invitation groupe</p>
                <h1 className="font-display text-xl font-extrabold text-wave-900">{info.groupe.nom}</h1>
                <p className="mt-1 text-xs capitalize text-wave-500">{info.groupe.type}</p>
              </div>

              <form onSubmit={submit} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><label className="label">Prénom</label><input className="input" value={form.prenom} onChange={(e)=>setForm({...form,prenom:e.target.value})} /></div>
                  <div><label className="label">Nom *</label><input required className="input" value={form.nom} onChange={(e)=>setForm({...form,nom:e.target.value})} /></div>
                </div>
                <div>
                  <label className="label">Pays et téléphone</label>
                  <div className="grid grid-cols-[minmax(0,1fr)_1.4fr] gap-2">
                    <select className="input px-3" value={countryCode} onChange={(e)=>selectCountry(e.target.value)}>
                      {countries.map((country) => (
                        <option key={country.code} value={country.code}>{country.flag} {country.code} {country.dial}</option>
                      ))}
                    </select>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-wave-400"/>
                      <input className="input pl-10" inputMode="tel" value={form.telephone} onFocus={()=>!form.telephone && selectCountry(countryCode)} onChange={(e)=>setForm({...form,telephone:e.target.value})} />
                    </div>
                  </div>
                </div>
                <div><label className="label">E-mail *</label><div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-wave-400"/><input required type="email" className="input pl-10" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} /></div></div>
                {!connectedUser && (
                  <>
                    <div className="rounded-2xl bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800">
                      Gardez bien votre email et votre mot de passe. Vous devrez vous en souvenir pour revenir dans votre compte plus tard.
                    </div>
                    <div>
                      <label className="label">Mot de passe *</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-wave-400"/>
                        <input required type={showPassword ? "text" : "password"} placeholder="6 caractere minimun" className="input pl-10 pr-10" value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} />
                        <button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-wave-400">
                          {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="label">Confirmer le mot de passe *</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-wave-400"/>
                        <input required type={showConfirmPassword ? "text" : "password"} className="input pl-10 pr-10" value={form.password_confirmation} onChange={(e)=>setForm({...form,password_confirmation:e.target.value})} />
                        <button type="button" onClick={()=>setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-wave-400">
                          {showConfirmPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                        </button>
                      </div>
                    </div>
                  </>
                )}
                {error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
                <button disabled={joining} className="btn-primary w-full !py-3.5">
                  {joining ? "Inscription..." : <>{connectedUser ? "Rejoindre le groupe" : "Créer mon accès et rejoindre"} <ArrowRight className="h-4 w-4" /></>}
                </button>
              </form>
              {connectedUser && <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-brand-600"><CheckCircle2 className="h-3.5 w-3.5" /> Connecté en tant que {connectedUser.name}</p>}
            </>
          )}
        </div>
      </motion.div>
    </main>
  );
}
