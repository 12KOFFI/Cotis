"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Prevent the mini-infobar from appearing on mobile
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Don't show immediately, maybe check if user dismissed it before
      if (!localStorage.getItem("pwa_prompt_dismissed")) {
        setShow(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Check if already installed
    window.addEventListener("appinstalled", () => {
      setShow(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("pwa_prompt_dismissed", "true");
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl bg-white p-4 shadow-xl ring-1 ring-wave-100 sm:bottom-6 sm:left-auto sm:right-6"
      >
        <button
          onClick={handleDismiss}
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full text-wave-400 transition hover:bg-wave-50 hover:text-wave-600"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-4 pr-6">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-wave-50 text-wave-600">
            <Download className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-bold text-wave-900">Installer CotisPro</h4>
            <p className="mt-0.5 text-xs text-wave-500">
              Installez l'application sur votre écran d'accueil pour un accès plus rapide.
            </p>
            <button
              onClick={handleInstallClick}
              className="mt-3 rounded-xl bg-wave-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-wave-800"
            >
              Installer maintenant
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
