import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "material-symbols/rounded.css";
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
  title: "AgroVision",
  description: "Cadastro de bovinos e fotos para o dataset",
  appleWebApp: { capable: true, title: "AgroVision", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#1F6B45",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        {/* Fora do Metadata API, que não deixa escolher o crossOrigin do manifest (ver app/app.webmanifest/route.ts). */}
        <link rel="manifest" href="/app.webmanifest" crossOrigin="use-credentials" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
