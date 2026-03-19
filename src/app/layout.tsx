import type { Metadata } from "next";
import { Baloo_2 } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import "./globals.css";
import { VisitorTracker } from "@/components/visitor-tracker";
import { GoogleAnalytics } from "@/components/google-analytics";

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
        url: "https://i.imgur.com/SLxSDoD.png",
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
      "https://i.imgur.com/SLxSDoD.png",
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
          <GoogleAnalytics />
          <VisitorTracker />
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
