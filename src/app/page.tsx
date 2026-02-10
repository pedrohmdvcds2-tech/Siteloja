
import Image from "next/image";
import Link from "next/link";
import { SchedulingForm } from "@/components/scheduling-form";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Faq } from "@/components/ai-chat";
import { Metadata } from "next";
import { PageHeader } from "@/components/page-header";

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


export default function Home() {
  const heroImage = PlaceHolderImages.find((p) => p.id === "petspa-hero");

  return (
    <div className="flex flex-col min-h-screen bg-background font-body text-foreground">
      <PageHeader />

      <main className="flex-grow w-full max-w-5xl mx-auto p-4 md:p-8">
        {/* Hero section from the screenshot */}
        {heroImage && (
          <div className="relative mb-8 flex h-[250px] items-center justify-center overflow-hidden rounded-xl bg-gray-800 text-white shadow-xl">
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              fill
              className="object-cover opacity-50"
              data-ai-hint={heroImage.imageHint}
              priority
            />
            <div className="relative z-10 text-center p-4">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                O melhor cuidado para o seu melhor amigo
              </h2>
              <p className="mt-2 text-lg">
                Agende online de forma rápida e fácil o banho e outros
                serviços para o seu pet.
              </p>
            </div>
          </div>
        )}

        <SchedulingForm />
        <Faq />
      </main>

      <footer className="w-full text-center p-6 text-sm text-muted-foreground border-t">
        <p>
          &copy; {new Date().getFullYear()} Princesas Pet Shop. Todos os
          direitos reservados.
        </p>
        <p className="mt-2">
          <Link href="/login" className="text-primary hover:underline">
            Acesso do Administrador
          </Link>
        </p>
      </footer>
    </div>
  );
}
