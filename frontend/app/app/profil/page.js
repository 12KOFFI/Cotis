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
        const url = window.URL.createObjectURL(new Blob([r.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `carte-${membre.groupe.nom}.pdf`);
        document.body.appendChild(link);
        link.click();
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
      <div className="mx-auto max-w-xl space-y-8 pb-10">
        {/* User Info */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="card flex items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full wave-bg text-2xl font-bold text-white shadow-soft">
            {(user.name || "?")[0]}
          </div>
          <div>
            <h2 className="font-display text-xl font-extrabold text-wave-900">{user.name}</h2>
            <div className="mt-1 space-y-1 text-sm text-wave-600">
              <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {user.email}</p>
              {user.telephone && <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {user.telephone}</p>}
              <p className="flex items-center gap-2 capitalize">
                <ShieldCheck className="h-4 w-4" /> {user.role === 'gestionnaire' ? 'Administrateur' : user.role}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Memberships & Cards */}
        <div className="space-y-6">
          <div>
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
