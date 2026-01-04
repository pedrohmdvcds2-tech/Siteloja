import Image from "next/image";
import { PawPrint } from "lucide-react";
import { SchedulingForm } from "@/components/scheduling-form";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function Home() {
  const heroImage = PlaceHolderImages.find((p) => p.id === "petspa-hero");

  return (
    <div className="flex flex-col items-center min-h-screen bg-background text-foreground font-body">
      <header className="w-full p-6 flex justify-center items-center gap-4 border-b">
        <div className="p-3 bg-primary/10 rounded-full">
          <PawPrint className="text-primary size-8" />
        </div>
        <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary tracking-tight">
          PetSpa Agendamentos
        </h1>
      </header>

      <main className="flex-grow w-full max-w-5xl mx-auto p-4 md:p-8">
        <div className="relative w-full h-56 md:h-64 rounded-xl overflow-hidden mb-8 shadow-lg">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              fill
              priority
              className="object-cover"
              data-ai-hint={heroImage.imageHint}
            />
          )}
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center p-4">
            <h2 className="text-3xl md:text-4xl font-bold text-white font-headline">
              O melhor cuidado para o seu melhor amigo
            </h2>
            <p className="text-lg text-white/90 mt-2 max-w-2xl">
              Agende online de forma rápida e fácil o banho e outros serviços
              para o seu pet.
            </p>
          </div>
        </div>

        <SchedulingForm />
      </main>

      <footer className="w-full text-center p-6 text-sm text-muted-foreground border-t">
        <p>
          &copy; {new Date().getFullYear()} PetSpa Agendamentos. Todos os
          direitos reservados.
        </p>
      </footer>
    </div>
  );
}
