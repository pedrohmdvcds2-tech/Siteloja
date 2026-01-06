"use client"; // Adicionado para permitir o uso de useEffect

import { useEffect } from "react";
import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import "./globals.css";

// A metadata estática pode entrar em conflito, então vamos removê-la por enquanto
// export const metadata: Metadata = {
//   title: "Princesas Pet Shop",
//   description: "Agende o melhor cuidado para o seu melhor amigo.",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Efeito para forçar a mudança do ícone
  useEffect(() => {
    // Tenta encontrar um ícone existente
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!link) {
      // Se não encontrar, cria um novo
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    // Define o seu ícone! O '?v=3' é para garantir que não seja cache.
    link.href = 'https://i.imgur.com/agbon6P.png?v=3';
    
    // Define o título da página também via JS para garantir consistência
    document.title = "Princesas Pet Shop";

  }, []); // O array vazio [] garante que isso execute apenas uma vez quando o layout carregar

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {/* A tag de ícone aqui será gerenciada pelo useEffect acima */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
