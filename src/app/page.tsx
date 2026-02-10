import Image from "next/image";
import Link from "next/link";
import { SchedulingForm } from "@/components/scheduling-form";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Faq } from "@/components/ai-chat";

export default function Home() {
  const heroImage = PlaceHolderImages.find((p) => p.id === "petspa-hero");

  return (
    <div className="flex flex-col items-center min-h-screen bg-background text-foreground font-body">
      <header className="w-full bg-primary/10 py-8 text-center shadow-lg">
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Image
            src="https://i.imgur.com/agbon6P.png"
            alt="Princesas Pet Shop Logo"
            width={96}
            height={96}
            className="rounded-full border-4 border-white/80 shadow-lg"
            priority
          />
          <div>
            <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-foreground">
              Princesas Pet Shop
            </h1>
            <p className="text-xl md:text-2xl text-foreground/80 mt-2">
              Cuidado Real para Seu Amiguinho
            </p>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-5xl mx-auto p-4 md:p-8">
        {heroImage && (
          <div className="mb-8 overflow-hidden rounded-xl shadow-xl">
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              width={1200}
              height={400}
              className="object-cover w-full h-auto"
              data-ai-hint={heroImage.imageHint}
            />
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
