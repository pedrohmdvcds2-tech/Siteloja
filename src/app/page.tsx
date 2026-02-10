
import Image from "next/image";
import Link from "next/link";
import { SchedulingForm } from "@/components/scheduling-form";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Faq } from "@/components/ai-chat";

export default function Home() {
  const heroImage = PlaceHolderImages.find((p) => p.id === "petspa-hero");

  return (
    <div className="flex flex-col min-h-screen bg-background font-body text-foreground">
      <header className="w-full bg-primary py-4 text-primary-foreground shadow-md">
        <div className="container mx-auto relative flex flex-row items-center justify-center gap-6">
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-4">
              <a href="https://www.instagram.com/princesaspetshop" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
              </a>
              <a href="https://wa.me/552136538610" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              </a>
              <a href="https://www.facebook.com/princesaspetshop" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
          </div>

          <div className="flex flex-row items-center justify-center gap-6">
            <Image
              src="https://i.imgur.com/SLxSDoD.png"
              alt="Princesas Pet Shop Logo"
              width={120}
              height={120}
              className="shrink-0"
            />
            <div className="flex flex-col">
              <h1 className="text-5xl font-bold font-headline">
                Princesas Pet Shop
              </h1>
              <p className="text-2xl">
                Cuidado Real para Seu Amiguinho
              </p>
            </div>
          </div>
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
