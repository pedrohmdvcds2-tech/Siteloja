import Image from "next/image";
import Link from "next/link";
import { SchedulingForm } from "@/components/scheduling-form";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Faq } from "@/components/ai-chat";

export default function Home() {
  const heroImage = PlaceHolderImages.find((p) => p.id === "petspa-hero");

  return (
    <div className="flex flex-col min-h-screen bg-background font-body text-foreground">
      {/* Header from the screenshot */}
      <header className="w-full bg-gradient-to-r from-pink-500 via-orange-400 to-yellow-400 py-4 text-white shadow-md">
        <div className="container mx-auto flex flex-col items-center justify-center gap-1 text-center">
          <Image
            src="https://i.imgur.com/agbon6P.png"
            alt="Princesas Pet Shop Logo"
            width={60}
            height={60}
            className="invert-[.90] sepia-[.1] saturate-[5] hue-rotate(300deg) brightness-[1.2] contrast-100"
          />
          <h1 className="text-2xl font-bold font-headline">
            Princesas Pet Shop
          </h1>
          <p className="text-md">
            Cuidado Real para Seu Amiguinho
          </p>
        </div>
      </header>

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
            />
            <div className="relative z-10 text-center p-4">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">O melhor cuidado para o seu melhor amigo</h2>
              <p className="mt-2 text-lg">Agende online de forma rápida e fácil o banho e outros serviços para o seu pet.</p>
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
