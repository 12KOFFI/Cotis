"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Building2, Search, User, Users } from "lucide-react";
import AppShell from "../../../components/AppShell";
import { api } from "../../../lib/api";

export default function AdminGroupesPage() {
  const router = useRouter();
  const [groupes, setGroupes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    api.get("/admin/groupes")
      .then((r) => setGroupes(r.data.groupes || []))
      .catch(() => router.push("/app/admin"))
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = groupes.filter((g) =>
    `${g.nom || ""} ${g.type || ""} ${g.plan || ""} ${g.gestionnaire?.name || ""}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <AppShell title="Groupes" role="super_admin" back>
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-wave-400" />
          <input className="input pl-10" placeholder="Rechercher un groupe..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[82px] animate-pulse rounded-2xl bg-wave-100/60" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center">
          <Building2 className="mx-auto h-8 w-8 text-wave-300" />
          <p className="mt-3 text-sm text-wave-500">Aucun groupe trouvé.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="mb-3 text-xs text-wave-500">{filtered.length} groupe{filtered.length > 1 ? "s" : ""}</p>
          {filtered.map((g, idx) => (
            <motion.div key={g.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.02 }}>
              <Link href={`/app/g/${g.id}`} className="card group flex items-center gap-3 transition hover:-translate-y-0.5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl wave-bg text-sm font-bold text-white">
                  {(g.nom || "?")[0]}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-display text-base font-bold">{g.nom}</p>
                    <span className="shrink-0 rounded-full bg-wave-50 px-1.5 py-0.5 text-[9px] font-semibold capitalize text-wave-600">{g.type}</span>
                    <span className="shrink-0 rounded-full bg-brand-50 px-1.5 py-0.5 text-[9px] font-semibold capitalize text-brand-600">{g.plan}</span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-3 text-[11px] text-wave-400">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {g.membres_count ?? 0} membres</span>
                    <span className="flex items-center gap-1"><User className="h-3 w-3" /> {g.gestionnaire?.name || "Gestionnaire inconnu"}</span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-wave-400 transition group-hover:translate-x-1 group-hover:text-wave-600" />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
