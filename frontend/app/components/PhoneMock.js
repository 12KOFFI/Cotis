"use client";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef } from "react";
import { 
  Wallet, 
  Users, 
  TrendingUp, 
  Bell, 
  ArrowUpRight, 
  PlusCircle, 
  Search,
  MessageCircle,
  MoreVertical
} from "lucide-react";

export default function PhoneMock() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-80px" });

  return (
    <div ref={ref} className="relative mx-auto w-[240px] max-[360px]:w-[220px] sm:w-[320px]">
      <AnimatePresence mode="wait">
        {isInView && (
          <motion.div
            key="phone"
            initial={{ opacity: 0, scale: 0.7, y: 60 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: -60 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Effet de lueur d'arrière-plan premium */}
            <div className="absolute -inset-10 -z-10 rounded-full bg-gradient-to-tr from-brand-400/20 via-blue-500/10 to-transparent blur-[100px] animate-pulse" />
            
            {/* Châssis du téléphone (Bezel) */}
            <div className="relative rounded-[2.5rem] bg-slate-900 p-2 shadow-[0_40px_100px_-20px_rgba(15,23,42,0.4)] sm:rounded-[3rem] sm:p-3">
              {/* Caméra / Notch dynamique */}
              <div className="absolute left-1/2 top-4 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-slate-900 border-2 border-white/5" />
              
              {/* Écran */}
              <div className="overflow-hidden rounded-[2rem] bg-slate-50 sm:rounded-[2.2rem]">
                {/* Header de l'App */}
                <div className="wave-bg relative px-4 pb-6 pt-10 text-white sm:px-5 sm:pb-8 sm:pt-12">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                        <Wallet className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-black tracking-widest text-white/60">Fonds Commun</p>
                        <p className="text-sm font-bold">Groupe de Cotisation</p>
                      </div>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                      <Bell className="h-5 w-5 text-white/80" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-white/80">Solde Total</p>
                    <div className="flex items-baseline gap-2">
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="font-display text-3xl font-black sm:text-4xl"
                      >
                        850 000
                      </motion.span>
                      <span className="text-sm font-bold text-white/70">FCFA</span>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-3">
                    <button className="flex-1 rounded-2xl bg-white py-3 text-[12px] font-black text-wave-700 shadow-lg shadow-wave-900/20 active:scale-95 transition-transform">
                      Payer
                    </button>
                    <button className="flex-1 rounded-2xl bg-white/20 backdrop-blur-md py-3 text-[12px] font-black text-white active:scale-95 transition-transform">
                      Retirer
                    </button>
                  </div>
                </div>

                {/* Corps de l'App */}
                <div className="p-4 space-y-4 sm:p-5">
                  {/* Widget Taux */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="bg-white rounded-3xl p-4 shadow-xl shadow-slate-200/50 border border-slate-100"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <TrendingUp className="h-4 w-4" />
                        </div>
                        <p className="text-xs font-bold text-slate-400">Collecte Mai</p>
                      </div>
                      <span className="text-xs font-black text-emerald-600">+12%</span>
                    </div>
                    <div className="flex items-end justify-between mb-2">
                      <p className="text-2xl font-black text-slate-800">92%</p>
                      <p className="text-[10px] font-bold text-slate-400">Objectif: 100%</p>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "92%" }}
                        transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-emerald-500 rounded-full"
                      />
                    </div>
                  </motion.div>

                  {/* Liste Transactions */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center px-1">
                      <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Activité</p>
                      <p className="text-[10px] font-bold text-brand-600">Voir tout</p>
                    </div>
                    
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.5 }}
                      className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow"
                    >
                      <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                        <ArrowUpRight className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-800">Fatou Diop</p>
                        <p className="text-[10px] font-medium text-slate-400">Il y a 5 min</p>
                      </div>
                      <p className="text-sm font-black text-emerald-600">+25k</p>
                    </motion.div>

                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.9, duration: 0.5 }}
                      className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 hover:shadow-lg transition-shadow"
                    >
                      <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                        <MessageCircle className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-800">Nouveau message</p>
                        <p className="text-[10px] font-medium text-slate-400">Trésorier • 12:40</p>
                      </div>
                      <div className="h-2 w-2 rounded-full bg-brand-500" />
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
