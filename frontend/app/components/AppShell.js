"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Wallet, Users, CreditCard, LogOut, ShieldCheck, Menu, X, ArrowLeft, Settings, User } from "lucide-react";
import { api, auth } from "../lib/api";

export default function AppShell({ title = "CotisPro", back, children, role = "gestionnaire", groupeId }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const u = auth.getUser();
    if (!u) { router.push("/login"); return; }
    setUser(u);
  }, [router]);

  async function doLogout() {
    try { await api.post("/auth/logout"); } catch {}
    auth.clear();
    router.push("/");
  }

  if (!user) return null;

  const userRole = user.role || role;
  const validGroupeId = groupeId && groupeId !== 'undefined';
  const nav = userRole === "super_admin"
    ? [
        { href: "/app/admin", label: "Tableau", Icon: ShieldCheck },
        { href: "/app/admin/groupes", label: "Groupes", Icon: Users },
      ]
    : userRole === "membre" && validGroupeId
    ? [
        { href: `/app/m/${groupeId}`, label: "Accueil", Icon: Home },
        { href: `/app/m/${groupeId}/paiements`, label: "Paiements", Icon: Wallet },
        { href: `/app/m/${groupeId}/carte`, label: "Carte", Icon: CreditCard },
      ]
    : validGroupeId
    ? [
        { href: `/app/g/${groupeId}`, label: "Accueil", Icon: Home },
        { href: `/app/g/${groupeId}/membres`, label: "Membres", Icon: Users },
        { href: `/app/g/${groupeId}/caisse`, label: "Caisse", Icon: Wallet },
        { href: "/app/portail", label: "Carte", Icon: CreditCard },
      ]
    : [
        { href: "/app", label: "Accueil", Icon: Home },
      ];

  return (
    <div className="min-h-screen bg-wave-50/40 pb-20 print:bg-white print:pb-0">
      <header className="sticky top-0 z-40 border-b border-wave-100 bg-white/90 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            {back ? (
              <button onClick={() => typeof back === 'string' ? router.push(back) : router.back()} className="grid h-9 w-9 place-items-center rounded-full border border-wave-100 text-wave-700 transition hover:bg-wave-50">
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : (
              <Link href={userRole === "membre" && groupeId ? `/app/m/${groupeId}` : userRole === "super_admin" ? "/app/admin" : "/app"} className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl wave-bg text-white shadow-soft">
                  <Wallet className="h-5 w-5" />
                </span>
              </Link>
            )}
            <div>
              <p className="text-[9px] uppercase tracking-widest text-wave-400">CotisPro</p>
              <h1 className="font-display text-sm font-bold leading-tight text-wave-900">{title}</h1>
            </div>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-full border border-wave-100 py-1.5 pl-1.5 pr-3 text-xs font-semibold text-wave-700 transition hover:bg-wave-50"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full wave-bg text-[11px] font-bold text-white">
              {(user.name || "?").trim()[0]?.toUpperCase()}
            </span>
            <span className="hidden sm:inline max-w-[100px] truncate">{user.name}</span>
            <Menu className="h-4 w-4 text-wave-400" />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-5">{children}</div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-wave-100 bg-white/95 backdrop-blur-xl safe-area-bottom print:hidden">
        <div className="mx-auto flex max-w-6xl items-stretch justify-around">
          {nav.map(({ href, label, Icon, disabled }) => {
            const active = pathname === href;
            const Cmp = disabled ? "span" : Link;
            return (
              <Cmp
                key={label}
                href={disabled ? undefined : href}
                className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition ${
                  disabled ? "text-wave-200" : active ? "text-wave-700" : "text-wave-400 hover:text-wave-600"
                }`}
              >
                {active && <motion.span layoutId="nav-active" className="absolute -top-px left-1/4 right-1/4 h-0.5 rounded-full wave-bg" />}
                <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
                {label}
              </Cmp>
            );
          })}
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-wave-900/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              className="absolute right-0 top-0 flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-soft"
            >
              <div className="flex items-center justify-between border-b border-wave-100 px-5 py-4">
                <h3 className="font-display text-lg font-extrabold">Mon compte</h3>
                <button onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full border border-wave-100 text-wave-600 transition hover:bg-wave-50">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5">
                <div className="rounded-2xl bg-wave-50 p-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-full wave-bg text-sm font-bold text-white">
                      {(user.name||"?")[0]}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{user.name}</p>
                      <p className="truncate text-xs text-wave-500">{user.email}</p>
                      <span className="mt-1 inline-block rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold capitalize text-wave-600">{user.role}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 space-y-1.5">
                  <Link href="/app/profil" onClick={() => setOpen(false)} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-wave-800 transition hover:bg-wave-50">
                    <User className="h-4 w-4 text-wave-500" /> Mon profil
                  </Link>
                  <Link href={user.role === "super_admin" ? "/app/admin/groupes" : "/app"} onClick={() => setOpen(false)} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-wave-800 transition hover:bg-wave-50">
                    <Home className="h-4 w-4 text-wave-500" /> {user.role === "super_admin" ? "Groupes" : "Mes groupes"}
                  </Link>
                  {user.role === "super_admin" && (
                    <Link href="/app/admin" onClick={() => setOpen(false)} className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-wave-800 transition hover:bg-wave-50">
                      <ShieldCheck className="h-4 w-4 text-wave-500" /> Administration
                    </Link>
                  )}
                </div>
              </div>

              <div className="border-t border-wave-100 px-5 py-4">
                <button onClick={doLogout} className="flex w-full items-center justify-center gap-2 rounded-full bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100">
                  <LogOut className="h-4 w-4" /> Se déconnecter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
