"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, ShieldCheck, User } from "lucide-react";
import AppShell from "../../components/AppShell";
import MemberCard from "../../components/MemberCard";
import { api, auth } from "../../lib/api";

export default function ProfilPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch latest user details including their group memberships
    api.get("/auth/me")
      .then((r) => {
        setUser(r.data.user);
        // update local cache optionally
        auth.setSession(auth.getToken(), r.data.user);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadPdf = (membre) => {
    // Generate pdf from backend
    api.get(`/groupes/${membre.groupe_id}/membres/${membre.id}/carte/pdf`, { responseType: 'blob' })
      .then(r => {
        const url = window.URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `carte-${membre.groupe.nom}.pdf`);
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 200);
      })
      .catch(err => {
        console.error(err);
        alert("Erreur lors du téléchargement.");
      });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <AppShell title="Mon Profil" back>
        <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-wave-200 border-t-wave-600" /></div>
      </AppShell>
    );
  }

  if (!user) return null;

  return (
    <AppShell title="Mon Profil" back>
      <div className="mx-auto max-w-xl space-y-8 pb-10 print:m-0 print:space-y-0 print:pb-0">
        {/* User Info */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 shadow-sm border border-wave-100 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 print:hidden">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full wave-bg text-3xl font-extrabold text-white shadow-md ring-4 ring-wave-100/50">
            {(user.name || "?")[0]}
          </div>
          <div className="text-center sm:text-left flex-1 min-w-0 w-full">
            <h2 className="font-display text-2xl font-extrabold text-wave-950 truncate leading-tight">{user.name}</h2>
            
            <div className="mt-4 flex flex-col sm:flex-row sm:flex-wrap items-center sm:items-center gap-2.5 sm:gap-4 text-xs font-bold text-wave-600">
              <div className="flex items-center gap-2 bg-wave-50 border border-wave-100 px-3 py-1.5 rounded-full">
                <Mail className="h-3.5 w-3.5 text-wave-400" />
                <span className="truncate">{user.email}</span>
              </div>
              {user.telephone && (
                <div className="flex items-center gap-2 bg-wave-50 border border-wave-100 px-3 py-1.5 rounded-full">
                  <Phone className="h-3.5 w-3.5 text-wave-400" />
                  <span>{user.telephone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-brand-50 border border-brand-100 text-brand-700 px-3 py-1.5 rounded-full capitalize font-black">
                <ShieldCheck className="h-3.5 w-3.5 text-brand-500" />
                <span>{user.role === 'gestionnaire' ? 'Administrateur' : (user.role === 'tresorier' ? 'Trésorier' : 'Membre')}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Memberships & Cards */}
        <div className="space-y-6 print:space-y-0">
          <div className="print:hidden">
            <h3 className="font-display text-lg font-bold text-wave-900 mb-1">Mes Cartes Membre</h3>
            <p className="text-sm text-wave-500">Vous avez {user.membres?.length || 0} groupe(s).</p>
          </div>

          {user.membres && user.membres.length > 0 ? (
            <div className="space-y-10">
              {user.membres.map((membre, idx) => (
                <motion.div 
                  key={membre.id} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: idx * 0.1 }}
                >
                  <MemberCard 
                    membre={membre} 
                    groupe={membre.groupe} 
                    onDownload={() => handleDownloadPdf(membre)}
                    onPrint={handlePrint}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-10">
              <p className="text-sm text-wave-500">Vous n'appartenez à aucun groupe pour le moment.</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
