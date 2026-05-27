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
