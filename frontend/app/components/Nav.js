"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Wallet, Zap, HelpCircle, Users, LogIn, UserPlus } from "lucide-react";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateNav = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);

      if (currentScrollY > 300) {
        if (currentScrollY > lastScrollY && !open) {
          setVisible(false);
        } else {
          setVisible(true);
        }
      } else {
        setVisible(true);
      }
      lastScrollY = currentScrollY;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateNav);
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open]);

  const desktopLinks = [
    { href: "#fonctionnalites", label: "Fonctionnalités" },
    { href: "#pour-qui", label: "Pour qui ?" },
    { href: "#faq", label: "FAQ" },
  ];

  const bottomTabs = [
    { href: "#fonctionnalites", label: "Fonctions", Icon: Zap },
    { href: "#pour-qui", label: "Pour qui", Icon: Users },
    { href: "#faq", label: "FAQ", Icon: HelpCircle },
    { href: "/login", label: "Connexion", Icon: LogIn, isLink: true },
    { href: "/register", label: "Inscription", Icon: UserPlus, isLink: true, accent: true },
  ];

  return (
    <>
      {/* ─── TOP BAR (Desktop toujours, Mobile logo seulement) ─── */}
      <div className="fixed top-0 inset-x-0 z-50 flex justify-center p-0 sm:p-4 pointer-events-none">
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: visible ? 0 : -100, opacity: visible ? 1 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`pointer-events-auto w-full transition-all duration-300 ${
            scrolled
              ? "sm:max-w-5xl sm:rounded-full border-b sm:border border-wave-200 bg-white/90 shadow-md backdrop-blur-xl"
              : "bg-white/50 backdrop-blur-md"
          }`}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-5 sm:py-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl wave-bg text-white shadow-soft sm:h-9 sm:w-9">
                <Wallet className="h-5 w-5" />
              </span>
              <span className="font-display text-base font-extrabold tracking-tight text-wave-900 sm:text-lg">
                CotisPro
              </span>
            </Link>

            {/* Desktop links */}
            <nav className="hidden items-center gap-7 md:flex">
              {desktopLinks.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="text-sm font-medium text-wave-700 transition hover:text-wave-900"
                >
                  {l.label}
                </a>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/login" className="btn-ghost !py-2 !px-4 text-sm">Se connecter</Link>
              <Link href="/register" className="btn-primary !py-2 !px-5 text-sm">Créer un compte</Link>
            </div>

            {/* Mobile: bouton pas nécessaire, on a le bottom bar */}
            <div className="md:hidden" />
          </div>
        </motion.header>
      </div>

      {/* ─── BOTTOM TAB BAR (Mobile uniquement, style LinkedIn) ─── */}
      <motion.nav
        initial={{ y: 0 }}
        animate={{ y: visible ? 0 : 100 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed inset-x-0 bottom-0 z-50 md:hidden border-t border-wave-100 bg-white/95 backdrop-blur-2xl shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pb-safe"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {bottomTabs.map((tab) => {
            const Cmp = tab.isLink ? Link : "a";
            return (
              <Cmp
                key={tab.label}
                href={tab.href}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 active:scale-90 ${
                  tab.accent
                    ? "relative"
                    : "text-wave-500 hover:text-brand-600"
                }`}
              >
                {tab.accent ? (
                  <div className="flex flex-col items-center justify-center -translate-y-1 bg-brand-600 text-white rounded-2xl w-14 h-12 shadow-lg shadow-brand-200">
                    <tab.Icon className="h-6 w-6 stroke-[2.5]" />
                    <span className="text-[9px] font-bold mt-0.5">{tab.label}</span>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <tab.Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold tracking-tight">{tab.label}</span>
                  </>
                )}
              </Cmp>
            );
          })}
        </div>
      </motion.nav>
    </>
  );
}
