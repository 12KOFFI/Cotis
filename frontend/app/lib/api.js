"use client";
import axios from "axios";

// Production (Vercel) : NEXT_PUBLIC_API_URL = https://api.votre-domaine.com/api
// Local : fallback vers localhost:8000
export const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api"
).trim();

export const api = axios.create({
  baseURL: API_BASE,
  headers: { Accept: "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("cp_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("cp_token");
      localStorage.removeItem("cp_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  },
);

export const auth = {
  setSession(token, user) {
    localStorage.setItem("cp_token", token);
    localStorage.setItem("cp_user", JSON.stringify(user));
  },
  getUser() {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("cp_user");
    return raw ? JSON.parse(raw) : null;
  },
  getToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("cp_token");
  },
  clear() {
    localStorage.removeItem("cp_token");
    localStorage.removeItem("cp_user");
  },
};

export const formatMoney = (n, devise = "FCFA") =>
  new Intl.NumberFormat("fr-FR").format(Number(n || 0)) +
  " " +
  (devise || "FCFA");

export const fcfa = (n) => formatMoney(n, "FCFA");
