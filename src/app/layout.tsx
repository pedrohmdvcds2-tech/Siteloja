import type { Metadata } from "next";
import { Baloo_2 } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import "./globals.css";

const baloo = Baloo_2({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-baloo",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Princesas Pet Shop",
  description: "Agende o melhor cuidado para o seu melhor amigo.",
  openGraph: {
    title: "Princesas Pet Shop",
    description: "Cuidado Real para Seu Amiguinho. Agende online!",
    siteName: "Princesas Pet Shop",
    images: [
      {
        url: "https://images.unsplash.com/photo-1604508558528-04bfc0d52379?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxoYXBweSUyMGRvZyUyMGdyb29taW5nfGVufDB8fHx8MTc2NzU0OTEwN3ww&ixlib=rb-4.1.0&q=80&w=1080",
        width: 1080,
        height: 720,
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Princesas Pet Shop",
    description: "Cuidado Real para Seu Amiguinho. Agende online!",
    images: [
      "https://images.unsplash.com/photo-1604508558528-04bfc0d52379?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw2fHxoYXBweSUyMGRvZyUyMGdyb29taW5nfGVufDB8fHx8MTc2NzU0OTEwN3ww&ixlib=rb-4.1.0&q=80&w=1080",
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${baloo.variable}`}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
