"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import {
  Wallet,
  Users,
  ShieldCheck,
  CreditCard,
  QrCode,
  BarChart3,
  Bell,
  ArrowRight,
  Check,
  Star,
  Zap,
  LockKeyhole,
  Globe2,
  HandCoins,
  ChevronDown,
  PlayCircle,
  Send,
  PieChart,
  FileDown,
  Download,
} from "lucide-react";
import Nav from "./Nav";
import PhoneMock from "./PhoneMock";
import InstallButton from "./pwa/InstallButton";

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

const stagger = (i = 0) => ({
  ...fadeUp,
  transition: { ...fadeUp.transition, delay: i * 0.1 },
});

export default function Landing() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const blobY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const [openFaq, setOpenFaq] = useState(null);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="min-h-screen text-wave-900">
      <Nav />

      {/* ─── HERO ─── */}
      <section
        ref={heroRef}
        className="hero-gradient relative overflow-hidden pb-12 pt-4 sm:pb-20"
      >
        {/* Cercles décoratifs animés */}
        <motion.div
          style={{ y: blobY }}
          aria-hidden
          className="pointer-events-none absolute -top-28 left-1/2 -z-0 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-brand-400/20 blur-[80px] sm:h-[600px] sm:w-[600px] sm:blur-[120px]"
        />
        <div
          className="pointer-events-none absolute right-0 top-0 -z-0 h-[240px] w-[240px] rounded-full bg-wave-400/20 blur-[70px] sm:h-[400px] sm:w-[400px] sm:blur-[100px]"
          aria-hidden
        />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-12 pt-8 sm:px-6 sm:pt-16 md:grid-cols-2 md:gap-16 lg:pt-24">
          <div className="text-center md:text-left">
            {/* Badge retiré */}

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto max-w-[20rem] font-display text-[2.5rem] font-black leading-[1.05] tracking-tight text-slate-900 sm:max-w-none sm:text-6xl lg:text-7xl"
            >
              Gerez vos{" "}
              <span className="relative inline-block text-brand-600">
              cotisations
                <svg
                  className="absolute -bottom-2 left-0 h-3 w-full text-brand-200/60"
                  viewBox="0 0 100 10"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 5 Q 25 0, 50 5 T 100 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{" "}
             sans stress.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mx-auto mt-6 max-w-sm text-base leading-relaxed text-slate-600 sm:max-w-lg sm:text-xl md:mx-0"
            >
              Gerez vos tontines, associations et cooperatives avec la puissance
              du digital. Simple, transparent et 100% securise.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.4,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center md:mt-10"
            >
              <Link
                href="/register"
                className="btn-primary group w-full !py-4 text-base shadow-xl shadow-brand-200/50 sm:w-auto sm:!px-8"
              >
                Creer un groupe
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#demo"
                className="btn-ghost group w-full !py-4 text-base sm:w-auto sm:!px-7"
              >
                <PlayCircle className="h-6 w-6 text-brand-500 transition-colors group-hover:text-brand-600" />
                Demo interactive
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.7 }}
              className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm font-semibold text-slate-500 md:justify-start"
            >
              {[
                {
                  Icon: ShieldCheck,
                  t: "Donnees protegees",
                  c: "text-emerald-500",
                },
                { Icon: Zap, t: "Demarrage instantane", c: "text-amber-500" },
              ].map(({ Icon, t, c }) => (
                <div key={t} className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${c}`} />
                  <span>{t}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            id="demo"
            className="relative"
          >
            <div className="absolute -inset-4 rounded-[3rem] bg-gradient-to-tr from-brand-100/40 to-wave-100/40 blur-2xl" />
            <PhoneMock />
          </motion.div>
        </div>

        {/* Stats bar avec design épuré */}
        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            {...fadeUp}
            className="grid grid-cols-2 gap-4 md:grid-cols-4"
          >
            {[
              {
                k: "+12 000",
                l: "Membres",
                icon: Users,
                color: "bg-brand-50 text-brand-600",
              },
              {
                k: "450+",
                l: "Groupes",
                icon: PieChart,
                color: "bg-wave-50 text-wave-600",
              },
              {
                k: "98 %",
                l: "Confiance",
                icon: Star,
                color: "bg-amber-50 text-amber-600",
              },
              {
                k: "2 min",
                l: "Installation",
                icon: Zap,
                color: "bg-emerald-50 text-emerald-600",
              },
            ].map((s, i) => (
              <motion.div
                key={i}
                {...stagger(i)}
                className="group card flex flex-col items-center text-center gap-2 !p-4 transition-all hover:bg-white hover:shadow-xl sm:flex-row sm:text-left sm:!p-6"
              >
                <span
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${s.color} transition-transform group-hover:scale-110`}
                >
                  <s.icon className="h-6 w-6" />
                </span>
                <div>
                  <span className="block font-display text-2xl font-black text-slate-900 leading-none">
                    {s.k}
                  </span>
                  <span className="mt-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
                    {s.l}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── INSTALL APP ─── */}
      <section id="install-app" className="mx-auto max-w-7xl px-4 py-16 sm:py-24 sm:px-6">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-[3rem] bg-wave-50 px-8 py-16 text-center shadow-inner"
        >
          <div aria-hidden className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-wave-100/50 blur-[100px]" />
          <div aria-hidden className="absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-wave-100/50 blur-[100px]" />

          <div className="relative z-10 mx-auto max-w-2xl">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white shadow-lg shadow-wave-600/20 sm:h-20 sm:w-20">
              <img src="/icons/icon-512.png" alt="CotisPro" className="h-10 w-10 sm:h-14 sm:w-14" />
            </div>
            <h2 className="mt-6 font-display text-3xl font-black leading-tight text-wave-900 sm:text-5xl">
              Téléchargez l&apos;application
            </h2>
            <p className="mt-4 text-lg text-wave-600 sm:text-xl">
              Accédez à CotisPro depuis votre écran d&apos;accueil, même sans
              connexion Internet.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <InstallButton large />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── FEATURES ─── */}
      <section
        id="fonctionnalites"
        className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-32"
      >
        <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
          <span className="chip bg-brand-50 text-brand-700 ring-brand-200">
            Puissant & Simple
          </span>
          <h2 className="mt-6 font-display text-3xl font-black leading-tight text-slate-900 sm:text-5xl">
            Tout ce qu'il faut pour gérer vos cotisations sans stress.
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Une interface pensée pour le terrain, avec des automatismes qui
            travaillent pour vous.
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              Icon: HandCoins,
              t: "Collecte Multi-canal",
              d: "Wave, Orange Money, Moov Money, MTN, Cash. Paiement par les membres avec preuve, validation par le gestionnaire.",
              bg: "bg-emerald-50 text-emerald-600",
            },
            {
              Icon: Users,
              t: "Gestion des Membres",
              d: "Invitations WhatsApp illimitées. Inscription instantanée sans mot de passe compliqué.",
              bg: "bg-brand-50 text-brand-600",
            },
            {
              Icon: Wallet,
              t: "Transparence Totale",
              d: "Un grand livre numérique accessible à tous. Chaque franc est tracé en temps réel.",
              bg: "bg-wave-50 text-wave-700",
            },
            {
              Icon: QrCode,
              t: "Identité Numérique",
              d: "Cartes QR personnalisées pour chaque membre. Scannez pour voir les statuts de paiement.",
              bg: "bg-amber-50 text-amber-600",
            },
            {
              Icon: BarChart3,
              t: "Analyses & Rapports",
              d: "Taux de recouvrement, prévisions et bilans financiers exportables en un clic.",
              bg: "bg-indigo-50 text-indigo-600",
            },
            {
              Icon: Bell,
              t: "Relances Automatisées",
              d: "Finies les relances manuelles. Le système envoie des rappels courtois avant l'échéance.",
              bg: "bg-rose-50 text-rose-600",
            },
          ].map(({ Icon, t, d, bg }, i) => (
            <motion.div
              key={t}
              {...stagger(i)}
              className="group card flex flex-col !p-6 transition-all hover:bg-white hover:shadow-2xl hover:shadow-brand-100/50"
            >
              <div
                className={`mb-6 grid h-14 w-14 place-items-center rounded-2xl ${bg} transition-all group-hover:rotate-6 group-hover:scale-110`}
              >
                <Icon className="h-7 w-7" />
              </div>
              <h3 className="font-display text-xl font-bold text-slate-900">
                {t}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── POUR QUI ─── */}
      <section
        id="pour-qui"
        className="relative overflow-hidden bg-slate-50 py-24 sm:py-32"
      >
        <div className="mx-auto grid max-w-7xl gap-16 px-4 sm:px-6 md:grid-cols-2 md:items-center">
          <motion.div {...fadeUp}>
            <span className="chip bg-brand-100 text-brand-800">
              Adaptabilité
            </span>
            <h2 className="mt-6 font-display text-3xl font-black leading-tight text-slate-900 sm:text-5xl">
              Un outil conçu pour les réalités du terrain.
            </h2>
            <div className="mt-8 space-y-5">
              {[
                "Gestionnaires de tontines de quartier",
                "Trésoriers d'associations & coopératives",
                "Réseaux de commerçants et clubs d'épargne",
                "Comités de solidarité et mutuelles",
              ].map((l, i) => (
                <motion.div
                  key={l}
                  {...stagger(i)}
                  className="flex items-center gap-4"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                    <Check className="h-4 w-4 stroke-[3]" />
                  </div>
                  <p className="text-base font-semibold text-slate-700">{l}</p>
                </motion.div>
              ))}
            </div>
            <Link
              href="/register"
              className="btn-primary mt-10 group w-full sm:w-auto"
            >
              Rejoindre CotisPro
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>

          <motion.div {...fadeUp} className="relative perspective-1000">
            <div className="absolute -inset-10 rounded-full bg-brand-200/30 blur-[100px]" />
            <div className="relative card overflow-hidden !p-0 shadow-2xl transition-transform hover:rotate-2">
              <div className="bg-blue-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
                      <Wallet className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-blue-100">
                        Statut Membre
                      </p>
                      <p className="text-lg font-bold">Actif</p>
                    </div>
                  </div>
                  <QrCode className="h-10 w-10 text-white/40" />
                </div>
              </div>
              <div className="p-8">
                <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white shadow-xl">
                  <div className="flex justify-between items-start mb-10">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400">
                        Association
                      </p>
                      <p className="text-xl font-bold">Fonds de solidarité pour les orphelins</p>
                    </div>
                    <div className="h-10 w-10 bg-white/10 rounded-lg backdrop-blur-sm flex items-center justify-center">
                      <ShieldCheck className="h-5 w-5 text-brand-400" />
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-slate-400">
                        Titulaire
                      </p>
                      <p className="text-lg font-bold">Mariam Koné</p>
                    </div>
                    <div className="bg-white p-2 rounded-lg">
                      <QrCode className="h-12 w-12 text-slate-900" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── ÉTAPES ─── */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
        <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
          <span className="chip bg-amber-50 text-amber-700 ring-amber-200">
            Rapidité
          </span>
          <h2 className="mt-6 font-display text-3xl font-black text-slate-900 sm:text-5xl">
            Digitalisez-vous en 3 étapes
          </h2>
        </motion.div>
        <div className="mt-20 grid gap-10 md:grid-cols-3">
          {[
            {
              n: "01",
              t: "Configurez",
              d: "Créez votre groupe, fixez le montant et la fréquence en quelques clics.",
              Icon: Users,
            },
            {
              n: "02",
              t: "Invitez",
              d: "Envoyez des invitations par WhatsApp. Vos membres rejoignent instantanément.",
              Icon: Send,
            },
            {
              n: "03",
              t: "Pilotez",
              d: "Encaissez les fonds et suivez la santé financière de votre groupe en temps réel.",
              Icon: BarChart3,
            },
          ].map((s, i) => (
            <motion.div
              key={s.n}
              {...stagger(i)}
              className="relative flex flex-col items-center text-center group"
            >
              <div className="mb-8 relative">
                <div className="absolute -inset-4 bg-brand-50 rounded-full scale-0 transition-transform group-hover:scale-100 duration-500" />
                <div className="relative h-20 w-20 flex items-center justify-center rounded-[2rem] bg-brand-600 text-white shadow-xl shadow-brand-200 transition-transform group-hover:-translate-y-2">
                  <s.Icon className="h-10 w-10" />
                </div>
              </div>
              <h3 className="font-display text-2xl font-bold text-slate-900 mb-4">
                {s.t}
              </h3>
              <p className="text-base text-slate-600 leading-relaxed px-4">
                {s.d}
              </p>
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 font-display text-8xl font-black text-slate-100 -z-10">
                {s.n}
              </span>
            </motion.div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32">
        <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
          <span className="chip bg-brand-50 text-brand-700">Témoignages</span>
          <h2 className="mt-6 font-display text-3xl font-black text-slate-900 sm:text-5xl">
            Ils nous font confiance
          </h2>
        </motion.div>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {[
            {
              n: "Fatou S.",
              r: "Présidente de tontine",
              q: "Plus besoin de carnet ! Tout est clair, mes membres reçoivent leur reçu par WhatsApp instantanément.",
              av: "F",
            },
            {
              n: "Ibrahima K.",
              r: "Trésorier d'association",
              q: "La gestion des retards est devenue automatique. Le taux de recouvrement a bondi de 40%.",
              av: "I",
            },
            {
              n: "Aminata D.",
              r: "Coopérative agricole",
              q: "Le grand livre numérique apporte une transparence totale. La confiance est revenue dans le groupe.",
              av: "A",
            },
          ].map((t, i) => (
            <motion.div
              key={t.n}
              {...stagger(i)}
              className="group card flex flex-col justify-between !p-8 transition-all hover:bg-white hover:shadow-2xl"
            >
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-6">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star key={k} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <p className="text-lg italic leading-relaxed text-slate-700">
                  « {t.q} »
                </p>
              </div>
              <div className="mt-10 flex items-center gap-4 border-t border-slate-100 pt-6">
                <div className="h-12 w-12 rounded-full bg-brand-600 flex items-center justify-center text-lg font-black text-white shadow-lg shadow-brand-200">
                  {t.av}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{t.n}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {t.r}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section
        id="faq"
        className="bg-slate-900 py-24 sm:py-32 text-white overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-wave-600/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="mx-auto max-w-3xl px-4 sm:px-6 relative z-10">
          <motion.div {...fadeUp} className="text-center mb-16">
            <span className="chip bg-white/10 text-white ring-white/20">
              Aide
            </span>
            <h2 className="mt-6 font-display text-3xl font-black sm:text-5xl">
              Questions fréquentes
            </h2>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                q: "Les paiements Wave sont-ils vraiment automatiques ?",
                a: "Oui, CotisPro est directement intégré à l'API Wave. Dès qu'un membre paie, le statut est mis à jour en temps réel sans intervention manuelle.",
              },
              {
                q: "Puis-je gérer plusieurs groupes ?",
                a: "Absolument. Vous pouvez créer autant de groupes (tontines, mutuelles, etc.) que nécessaire avec un seul compte administrateur.",
              },
              {
                q: "Comment mes membres rejoignent le groupe ?",
                a: "C'est très simple : vous partagez un lien unique par WhatsApp. Le membre clique, s'inscrit en 1 minute et peut commencer à cotiser.",
              },
              {
                q: "Mes données sont-elles en sécurité ?",
                a: "La sécurité est notre priorité. Vos données sont chiffrées et hébergées sur des serveurs sécurisés. Nous ne stockons aucune information bancaire sensible.",
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                {...stagger(i * 0.2)}
                className={`overflow-hidden rounded-2xl transition-all ${openFaq === i ? "bg-white/10 ring-1 ring-white/20" : "bg-white/5 hover:bg-white/10"}`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-bold text-lg"
                >
                  {f.q}
                  <div
                    className={`h-8 w-8 rounded-full bg-white/10 flex items-center justify-center transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                  >
                    <ChevronDown className="h-5 w-5" />
                  </div>
                </button>
                <motion.div
                  initial={false}
                  animate={{
                    height: openFaq === i ? "auto" : 0,
                    opacity: openFaq === i ? 1 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-6 text-slate-300 leading-relaxed">
                    {f.a}
                  </p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <motion.div
          {...fadeUp}
          className="relative overflow-hidden rounded-[3rem] bg-brand-600 px-8 py-16 text-center text-white shadow-2xl shadow-brand-200"
        >
          <div
            aria-hidden
            className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-white/10 blur-[100px]"
          />
          <div
            aria-hidden
            className="absolute -left-20 bottom-0 h-80 w-80 rounded-full bg-white/10 blur-[100px]"
          />

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="font-display text-3xl font-black leading-tight sm:text-5xl">
              Prêt à simplifier la gestion de votre groupe ?
            </h2>
            <p className="mt-6 text-xl text-brand-100">
              Rejoignez des centaines de gestionnaires qui ont déjà digitalisé
              leur tontine. Inscription gratuite, sans engagement.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-white px-10 py-5 text-lg font-bold text-brand-600 shadow-xl transition-all hover:bg-brand-50 active:scale-95"
              >
                Créer mon compte
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-3 rounded-2xl border-2 border-white/30 px-10 py-5 text-lg font-bold text-white transition-all hover:bg-white/10 active:scale-95"
              >
                Se connecter
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-slate-100 bg-white py-12 pb-32 text-slate-500 sm:py-16 md:pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-200">
                <Wallet className="h-6 w-6" />
              </div>
              <span className="font-display text-2xl font-black text-slate-900">
                CotisPro
              </span>
            </div>
            <p className="text-sm font-medium">
              © {new Date().getFullYear()} CotisPro — Propulser la finance
              collaborative en Afrique.
            </p>
            <div className="flex gap-8 text-sm font-bold">
              <a href="#" className="hover:text-brand-600 transition-colors">
                Confidentialité
              </a>
              <a href="#" className="hover:text-brand-600 transition-colors">
                Conditions
              </a>
            </div>
          </div>
        </div>
      </footer>

      {showTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => document.getElementById("install-app")?.scrollIntoView({ behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-50 grid h-12 w-12 place-items-center rounded-2xl bg-wave-600 text-white shadow-lg shadow-wave-600/30 transition-all hover:bg-wave-700 active:scale-90"
        >
          <Download className="h-5 w-5" />
        </motion.button>
      )}
    </main>
  );
}
