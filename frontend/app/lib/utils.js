/**
 * Utilitaires partagés pour le frontend.
 * Centralise les fonctions dupliquées entre les pages.
 */

/**
 * Formate une date ISO en format français court (ex: "26 mai 2026").
 */
export const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

/**
 * Formate l'heure d'un timestamp ISO en format français (ex: "14:30").
 */
export const fmtTime = (d) => {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Formate une date ISO en format français complet avec jour de la semaine
 * (ex: "lundi 26 mai 2026").
 */
export const fmtDateFull = (d) =>
  d
    ? new Date(d).toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";
