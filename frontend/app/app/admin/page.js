"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Users, Building2, Wallet, Send, BadgePercent, Zap } from "lucide-react";
import AppShell from "../../components/AppShell";
import { api, auth, fcfa } from "../../lib/api";

export default function SuperAdmin() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    api.get("/admin/overview").then((r)=>{ setData(r.data); setLoading(false); }).catch((e)=>{
      if (e.response && (e.response.status === 401 || e.response.status === 403)) {
        router.push("/app");
      } else {
        console.error("Failed to load admin overview:", e);
        // Ne pas rediriger, juste masquer le loading (ou afficher une erreur)
        setLoading(false);
      }
    });
  }, [router]);

  return (
    <AppShell title="Administration" role="super_admin">
      {!data ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[1,2,3,4].map(i=><div key={i} className="h-24 animate-pulse rounded-3xl bg-wave-100/60"/>)}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {[1,2].map(i=><div key={i} className="h-48 animate-pulse rounded-3xl bg-wave-100/60"/>)}
          </div>
        </div>
      ) : data && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.3}}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <KPI Icon={Users} label="Utilisateurs" value={data.users} sub={`${data.gestionnaires} gest. · ${data.membres} mbr.`} tone="dark"/>
            <KPI Icon={Building2} label="Groupes" value={data.groupes}/>
            <KPI Icon={Wallet} label="Volume encaissé" value={fcfa(data.paiements_total)}/>
            <KPI Icon={BadgePercent} label="Commissions Nettes" value={fcfa(data.commissions_total || 0)} sub={`+ ${fcfa(data.frais_gateway_total || 0)} frais payés`} tone="success"/>
            <KPI Icon={Send} label="Invitations" value={data.invitations_envoyees}/>
          </div>

          <div className="mt-4 space-y-2.5">
            <Link href="/app/admin/merchant" className="block">
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 p-4 text-white shadow-lg shadow-brand-500/20 flex items-center justify-between group hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15"><Zap className="h-5 w-5" /></span>
                  <div><p className="text-sm font-bold">Gateway Marchand GeniusPay</p><p className="text-xs text-brand-200 mt-0.5">Soldes, wallets & monitoring API</p></div>
                </div>
                <span className="text-xs font-bold bg-white/20 px-3 py-1.5 rounded-xl group-hover:bg-white/30 transition">Ouvrir</span>
              </motion.div>
            </Link>
            <div className="grid grid-cols-2 gap-2.5">
              <Link href="/app/admin/payouts" className="block">
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                  className="rounded-2xl bg-white p-4 border border-wave-100 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow h-full">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100"><Send className="h-5 w-5" /></span>
                  <div><p className="text-sm font-bold text-wave-900">Monitoring Payouts</p><p className="text-[11px] text-wave-400 mt-0.5">Audit des retraits</p></div>
                </motion.div>
              </Link>
              <Link href="/app/admin/soldes" className="block">
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="rounded-2xl bg-white p-4 border border-wave-100 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow h-full">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100"><Wallet className="h-5 w-5" /></span>
                  <div><p className="text-sm font-bold text-wave-900">Soldes Groupes</p><p className="text-[11px] text-wave-400 mt-0.5">Balance par groupe</p></div>
                </motion.div>
              </Link>
            </div>
          </div>

          <div className="mt-6">
            <div className="card">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-base font-bold">Dernières Transactions (Vue Globale)</h3>
              </div>
              {(!data.derniers_paiements || data.derniers_paiements.length === 0) ? (
                <p className="py-6 text-center text-sm text-wave-500">Aucune transaction enregistrée.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-wave-100 text-wave-400">
                        <th className="py-3 px-2 font-bold uppercase tracking-wider text-[10px]">Date</th>
                        <th className="py-3 px-2 font-bold uppercase tracking-wider text-[10px]">Groupe / Membre</th>
                        <th className="py-3 px-2 font-bold uppercase tracking-wider text-[10px] text-right">Volume facturé</th>
                        <th className="py-3 px-2 font-bold uppercase tracking-wider text-[10px] text-right">Groupe reçoit</th>
                        <th className="py-3 px-2 font-bold uppercase tracking-wider text-[10px] text-right text-emerald-600">Commission Pro</th>
                        <th className="py-3 px-2 font-bold uppercase tracking-wider text-[10px] text-center">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-wave-50">
                      {data.derniers_paiements.map((tx) => (
                        <tr key={tx.id} className="hover:bg-wave-50/50">
                          <td className="py-3 px-2 whitespace-nowrap text-wave-600 font-medium">{new Date(tx.date_paiement).toLocaleDateString("fr-FR")}</td>
                          <td className="py-3 px-2">
                            <p className="font-bold text-wave-900 truncate max-w-[200px]">{tx.groupe?.nom}</p>
                            <p className="text-[11px] text-wave-400 truncate max-w-[200px]">{tx.membre?.prenom} {tx.membre?.nom}</p>
                          </td>
                          <td className="py-3 px-2 text-right font-bold text-wave-900">{fcfa(tx.montant)}</td>
                          <td className="py-3 px-2 text-right font-semibold text-wave-500">{fcfa(tx.montant_membre || tx.montant)}</td>
                          <td className="py-3 px-2 text-right font-black text-emerald-600">{fcfa(tx.commission_plateforme || 0)}</td>
                          <td className="py-3 px-2 text-center">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                              tx.statut === "reussi" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                              tx.statut === "en_attente" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                              "bg-rose-50 text-rose-600 border border-rose-100"
                            }`}>
                              {tx.statut}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="card">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-base font-bold">Derniers groupes</h3>
                <span className="text-[10px] text-wave-400">{data.derniers_groupes.length} récents</span>
              </div>
              {data.derniers_groupes.length === 0 ? (
                <p className="py-6 text-center text-sm text-wave-500">Aucun groupe.</p>
              ) : (
                <ul className="divide-y divide-wave-50">
                  {data.derniers_groupes.map((g)=>(
                    <li key={g.id} className="flex items-center justify-between py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{g.nom}</p>
                        <p className="text-[11px] text-wave-400 capitalize">{g.type} · {g.plan}</p>
                      </div>
                      <p className="shrink-0 text-[10px] text-wave-400">{new Date(g.created_at).toLocaleDateString("fr-FR")}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="card">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-base font-bold">Derniers utilisateurs</h3>
                <span className="text-[10px] text-wave-400">{data.derniers_users.length} récents</span>
              </div>
              {data.derniers_users.length === 0 ? (
                <p className="py-6 text-center text-sm text-wave-500">Aucun utilisateur.</p>
              ) : (
                <ul className="divide-y divide-wave-50">
                  {data.derniers_users.map((u)=>(
                    <li key={u.id} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full wave-bg text-[11px] font-bold text-white">{(u.name||"?")[0]}</span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{u.name}</p>
                          <p className="truncate text-[11px] text-wave-400">{u.email}</p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-wave-50 px-2 py-0.5 text-[9px] font-semibold capitalize text-wave-600">{u.role}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AppShell>
  );
}

function KPI({ Icon, label, value, sub, tone }) {
  const dark = tone === "dark";
  const success = tone === "success";
  return (
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className={`rounded-3xl p-4 shadow-soft ring-1 ring-wave-100 ${dark ? "wave-bg text-white ring-0" : success ? "bg-emerald-600 text-white ring-0" : "bg-white"}`}>
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${dark || success ? "bg-white/15" : "bg-wave-50 text-wave-700"}`}><Icon className="h-5 w-5"/></span>
        <div className="min-w-0">
          <p className={`text-[11px] leading-tight ${dark || success ? "text-white/70" : "text-wave-500"}`}>{label}</p>
          <p className="font-display text-xl font-extrabold leading-tight">{value}</p>
        </div>
      </div>
      {sub && <p className={`mt-2 text-[10px] ${dark || success ? "text-white/60" : "text-wave-400"}`}>{sub}</p>}
    </motion.div>
  );
}
