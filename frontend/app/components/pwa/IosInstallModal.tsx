"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share2, Plus, ArrowDown } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const steps = [
  {
    icon: Share2,
    title: "Appuyez sur Partager",
    desc: "Dans la barre Safari en bas",
  },
  {
    icon: ArrowDown,
    title: "Faites défiler vers le bas",
    desc: "Jusqu'à voir la liste d'actions",
  },
  {
    icon: Plus,
    title: `"Sur l'écran d'accueil"`,
    desc: "Appuyez pour ajouter l'application",
  },
];

export default function IosInstallModal({ open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-end bg-wave-900/50 backdrop-blur-sm sm:place-items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl bg-white p-6 pb-8 shadow-soft sm:rounded-3xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-wave-50 text-wave-600">
                  <Download className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-extrabold text-wave-900">
                  Installer CotisPro
                </h3>
              </div>
              <button
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-full border border-wave-100 text-wave-500 transition hover:bg-wave-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-2xl bg-wave-50 p-4"
                >
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-white shadow-sm">
                    <step.icon className="h-7 w-7 text-wave-600" />
                  </div>
                  <div>
                    <p className="font-bold text-wave-900">{step.title}</p>
                    <p className="text-sm text-wave-500">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onClose}
              className="mt-6 w-full rounded-2xl bg-wave-900 py-4 text-base font-bold text-white transition hover:bg-black"
            >
              J&apos;ai compris
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
