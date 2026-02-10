'use client';

import Image from "next/image";
import { Instagram, Facebook, MessageSquare } from "lucide-react";

export function PageHeader() {
  return (
    <header className="w-full bg-primary py-4 text-primary-foreground shadow-md">
      <div className="container mx-auto flex flex-wrap flex-col md:flex-row items-center justify-center md:justify-between gap-4">
        <div className="flex flex-row items-center justify-center gap-4">
          <Image
            src="https://i.imgur.com/SLxSDoD.png"
            alt="Princesas Pet Shop Logo"
            width={120}
            height={120}
            className="shrink-0"
            priority
          />
          <div className="flex flex-col text-center md:text-left">
            <h1 className="text-4xl lg:text-5xl font-bold font-headline">
              <span className="md:hidden">Princesas<br />Pet Shop</span>
              <span className="hidden md:inline">Princesas Pet Shop</span>
            </h1>
            <p className="text-lg lg:text-2xl">
              Cuidado Real para Seu Amiguinho
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          <a
            href="https://www.instagram.com/princesaspetshop/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Siga-nos no Instagram"
            className="h-10 w-10 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors"
          >
            <Instagram className="h-6 w-6" />
          </a>
          <a
            href="https://wa.me/552136538610"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Fale conosco no WhatsApp"
            className="h-10 w-10 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors"
          >
            <MessageSquare className="h-6 w-6" />
          </a>
          <a
            href="https://www.facebook.com/princesaspetshop"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Siga-nos no Facebook"
            className="h-10 w-10 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors"
          >
            <Facebook className="h-6 w-6" />
          </a>
        </div>
      </div>
    </header>
  );
}
