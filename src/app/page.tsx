import Image from "next/image";
import Link from "next/link";
import { SchedulingForm } from "@/components/scheduling-form";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function Home() {
  const heroImage = PlaceHolderImages.find((p) => p.id === "petspa-hero");

  return (
    <div className="flex flex-col items-center min-h-screen bg-background text-foreground font-body">
      <header className="w-full p-6 bg-gradient-to-r from-[#c724b1] via-[#e05d5d] to-[#f7b733] text-white">
        <div className="container mx-auto flex items-center justify-center gap-4">
           <div className="relative h-16 w-16">
            <Image
              src="https://picsum.photos/seed/logo/96/96"
              alt="Princesas Pet Shop Logo"
              fill
              sizes="64px"
              className="object-contain"
            />
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-bold font-headline">
              Princesas Pet Shop
            </h1>
            <p className="text-lg">Cuidado Real para Seu Amiguinho</p>
          </div>
        </div>
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
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                data-ai-hint={heroImage.imageHint}
              />
            )}
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-center p-4">
              <h2 className="text-3xl md:text-4xl font-bold text-white font-headline">
                O melhor cuidado para o seu melhor amigo
              </h2>
              <p className="text-lg text-white/90 mt-2 max-w-2xl">
                Agende online de forma rápida e fácil o banho e outros serviços para o seu pet.
              </p>
            </div>
          </div>
        <SchedulingForm />
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
