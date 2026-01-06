import Image from "next/image";
import Link from "next/link";
import { PawPrint } from "lucide-react";
import { SchedulingForm } from "@/components/scheduling-form";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function Home() {
  const heroImage = PlaceHolderImages.find((p) => p.id === "petspa-hero");

  return (
    <div className="flex flex-col items-center min-h-screen bg-background text-foreground font-body">
      <header className="w-full">
        <Image
          src="https://i.imgur.com/rN9gTJa.png"
          alt="Banner Princesas Pet Shop"
          width={1200}
          height={400}
          className="w-full h-auto object-cover"
          priority
        />
      </header>

      <main className="flex-grow w-full max-w-5xl mx-auto p-4 md:p-8">
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
