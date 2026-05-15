import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const display = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata = {
  title: "CotisPro — Gérez vos tontines et cotisations en toute simplicité",
  description:
    "CotisPro aide les gestionnaires et associations à piloter tontines, cooperatives et cotisations. Paiements Wave, suivi en temps réel, carte virtuelle sécurisée.",
  icons: { icon: "/favicon.ico" },
};

export const viewport = { themeColor: "#1e6dff" };

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${inter.variable} ${display.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
