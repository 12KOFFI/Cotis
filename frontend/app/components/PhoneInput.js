"use client";
import { useState, useRef, useEffect } from "react";
import { Phone, ChevronDown } from "lucide-react";

const COUNTRIES = [
  { code: "CI", label: "Côte d'Ivoire", dial: "+225", flag: "🇨🇮" },
  { code: "SN", label: "Sénégal", dial: "+221", flag: "🇸🇳" },
  { code: "ML", label: "Mali", dial: "+223", flag: "🇲🇱" },
  { code: "BF", label: "Burkina Faso", dial: "+226", flag: "🇧🇫" },
  { code: "GN", label: "Guinée", dial: "+224", flag: "🇬🇳" },
  { code: "BJ", label: "Bénin", dial: "+229", flag: "🇧🇯" },
  { code: "TG", label: "Togo", dial: "+228", flag: "🇹🇬" },
  { code: "CM", label: "Cameroun", dial: "+237", flag: "🇨🇲" },
  { code: "GA", label: "Gabon", dial: "+241", flag: "🇬🇦" },
  { code: "CG", label: "Congo", dial: "+242", flag: "🇨🇬" },
  { code: "CD", label: "RD Congo", dial: "+243", flag: "🇨🇩" },
  { code: "MG", label: "Madagascar", dial: "+261", flag: "🇲🇬" },
  { code: "MA", label: "Maroc", dial: "+212", flag: "🇲🇦" },
  { code: "FR", label: "France", dial: "+33", flag: "🇫🇷" },
  { code: "BE", label: "Belgique", dial: "+32", flag: "🇧🇪" },
  { code: "CH", label: "Suisse", dial: "+41", flag: "🇨🇭" },
  { code: "CA", label: "Canada", dial: "+1", flag: "🇨🇦" },
  { code: "US", label: "États-Unis", dial: "+1", flag: "🇺🇸" },
];

/**
 * PhoneInput — Champ téléphone avec sélecteur de pays et indicatif automatique
 * @param {string} value - La valeur complète du téléphone (ex: "+225 0700000000")
 * @param {function} onChange - Callback avec la nouvelle valeur complète
 * @param {string} defaultCountry - Code pays par défaut (ex: "CI")
 * @param {string} className - Classes CSS additionnelles pour le wrapper
 * @param {boolean} large - Utiliser le style large (h-14) pour la page register
 */
export default function PhoneInput({ value = "", onChange, defaultCountry = "CI", className = "", large = false }) {
  const [open, setOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState(() => {
    // Detect country from existing value
    if (value) {
      const found = COUNTRIES.find((c) => value.startsWith(c.dial));
      if (found) return found.code;
    }
    return defaultCountry;
  });
  const dropRef = useRef(null);

  const selected = COUNTRIES.find((c) => c.code === selectedCode) || COUNTRIES[0];

  // Extract the local number (without the dial code)
  const localNumber = (() => {
    if (!value) return "";
    if (value.startsWith(selected.dial)) {
      return value.slice(selected.dial.length).trimStart();
    }
    // Check if value starts with any known dial code
    const matchedCountry = COUNTRIES.find((c) => value.startsWith(c.dial));
    if (matchedCountry) {
      return value.slice(matchedCountry.dial.length).trimStart();
    }
    // If value starts with "+", strip it
    if (value.startsWith("+")) return "";
    return value;
  })();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function selectCountry(country) {
    setSelectedCode(country.code);
    setOpen(false);
    const newVal = localNumber ? `${country.dial} ${localNumber}` : `${country.dial} `;
    onChange(newVal);
  }

  function handleLocalChange(e) {
    const raw = e.target.value.replace(/[^0-9\s]/g, ""); // Keep only digits and spaces
    const full = raw ? `${selected.dial} ${raw}` : "";
    onChange(full);
  }

  const inputHeight = large ? "h-14" : "h-[46px]";

  return (
    <div className={`flex gap-1.5 ${className}`}>
      {/* Country selector */}
      <div className="relative" ref={dropRef}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`input flex items-center gap-1 px-2.5 ${inputHeight} min-w-[90px] shrink-0 justify-between ${large ? "bg-slate-50 border-slate-100" : ""}`}
        >
          <span className="text-base leading-none">{selected.flag}</span>
          <span className="text-xs font-bold text-wave-700">{selected.dial}</span>
          <ChevronDown className={`h-3 w-3 text-wave-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute left-0 top-full z-50 mt-1 w-[220px] max-h-[240px] overflow-y-auto rounded-2xl bg-white shadow-xl ring-1 ring-wave-100 border border-wave-100">
            {COUNTRIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => selectCountry(c)}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition hover:bg-wave-50 ${
                  c.code === selectedCode ? "bg-wave-50 font-bold" : ""
                }`}
              >
                <span className="text-base leading-none">{c.flag}</span>
                <span className="flex-1 text-sm text-wave-800">{c.label}</span>
                <span className="text-xs font-semibold text-wave-500">{c.dial}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Phone number input */}
      <div className="relative flex-1">
        <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 text-wave-400 ${large ? "h-5 w-5 text-slate-300" : "h-4 w-4"}`} />
        <input
          type="text"
          inputMode="tel"
          className={`input pl-10 ${inputHeight} w-full ${large ? "bg-slate-50 border-slate-100" : ""}`}
          placeholder="07 00 00 00 00"
          value={localNumber}
          onChange={handleLocalChange}
        />
      </div>
    </div>
  );
}

export { COUNTRIES };
