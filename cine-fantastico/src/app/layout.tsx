import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/hooks/useAuth";
import NoSSR from "@/components/NoSSR";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cine Fantástico - Sistema de Gestión",
  description: "Sistema moderno de gestión de cine con reservas de asientos, administración de películas y funciones",
  keywords: ["cine", "películas", "reservas", "entretenimiento"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-gradient-to-br from-cinema-dark to-cinema-dark-card text-white`}
        suppressHydrationWarning={true}
      >
        <NoSSR>
          <AuthProvider>
            <div className="min-h-screen">
              {children}
            </div>
          </AuthProvider>
        </NoSSR>
      </body>
    </html>
  );
}
