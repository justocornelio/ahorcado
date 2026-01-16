import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 🔴 Cambia esta URL si usas Vercel u otro dominio
const SITE_URL = "https://ahorcado-sooty.vercel.app/";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "Juego del Ahorcado",
    template: "%s | Juego del Ahorcado",
  },

  description:
    "🧠🎯 Juega al clásico Juego del Ahorcado con un diseño moderno. Adivina la palabra, mejora tu vocabulario y reta tu mente.",

  keywords: [
    "juego del ahorcado",
    "ahorcado",
    "hangman",
    "juego educativo",
    "juego de palabras",
    "vocabulario",
    "juego online",
  ],

  authors: [{ name: "Hangman Game Studio" }],
  creator: "Juego del Ahorcado",
  publisher: "Juego del Ahorcado",

  openGraph: {
    title: "Juego del Ahorcado",
    description:
      "🧠🎯 Adivina la palabra antes de perder. Un clásico juego del ahorcado con diseño moderno.",
    url: SITE_URL,
    siteName: "Juego del Ahorcado",
    images: [
      {
        url: "public/logo.png", // 1200x630
        width: 1200,
        height: 630,
        alt: "Juego del Ahorcado",
      },
    ],
    locale: "es_ES",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Juego del Ahorcado",
    description:
      "🧠🎯 El clásico juego del ahorcado con diseño moderno y divertido.",
    images: ["public/logo.png"],
  },

  icons: {
    icon: "public/logo.png",
    apple: "/apple-touch-icon.png",
  },

  robots: {
    index: true,
    follow: true,
  },

  category: "games",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-blue-600 to-blue-800 text-white`}
      >
        {children}
      </body>
    </html>
  );
}
