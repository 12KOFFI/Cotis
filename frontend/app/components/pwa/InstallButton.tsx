"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { usePwaInstall } from "./usePwaInstall";
import IosInstallModal from "./IosInstallModal";

interface Props {
  className?: string;
  large?: boolean;
}

export default function InstallButton({ className = "", large = false }: Props) {
  const { canInstall, isIOS, hasPrompt, handleInstall } = usePwaInstall();
  const [showIosModal, setShowIosModal] = useState(false);

  if (!canInstall) return null;

  const handleClick = () => {
    if (isIOS) {
      setShowIosModal(true);
    } else if (hasPrompt) {
      handleInstall();
    } else {
      setShowIosModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`group relative overflow-hidden rounded-2xl bg-wave-600 text-white font-bold shadow-lg shadow-wave-600/30 transition-all hover:bg-wave-700 active:scale-[0.97] ${className} ${large ? "w-full px-6 py-5 text-lg sm:w-auto sm:px-10 sm:py-5" : "px-6 py-4 text-base"}`}
      >
        <div className="absolute inset-0 -translate-x-full shimmer transition-transform duration-1000 group-hover:translate-x-full" />
        <div className="relative z-10 flex items-center justify-center gap-3">
          <Download className={large ? "h-7 w-7" : "h-6 w-6"} />
          <span>Télécharger l&apos;application</span>
        </div>
      </button>
      <IosInstallModal
        open={showIosModal}
        onClose={() => setShowIosModal(false)}
      />
    </>
  );
}
