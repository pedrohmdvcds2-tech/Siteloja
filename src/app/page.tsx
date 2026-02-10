import Image from "next/image";
import Link from "next/link";
import { SchedulingForm } from "@/components/scheduling-form";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Faq } from "@/components/ai-chat";

export default function Home() {
  const heroImage = PlaceHolderImages.find((p) => p.id === "petspa-hero");

  return (
    <div className="flex flex-col items-center min-h-screen bg-background text-foreground font-body">
      <header className="relative w-full h-64 md:h-80 flex items-center justify-center text-center shadow-lg">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            priority
            className="object-cover"
            sizes="100vw"
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 flex flex-col items-center gap-4 text-white">
          <Image
            src="https://i.imgur.com/agbon6P.png"
            alt="Princesas Pet Shop Logo"
            width={80}
            height={80}
            className="rounded-full border-4 border-white/80 shadow-lg"
            priority
          />
          <div>
            <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight">
              Princesas Pet Shop
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mt-2">
              Cuidado Real para Seu Amiguinho
            </p>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-5xl mx-auto p-4 md:p-8">
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
