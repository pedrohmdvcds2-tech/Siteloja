"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

const storeImages = [
  "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxkb2clMjBncm9vbWluZ3xlbnwwfHx8fDE3Njc1NDkxMDd8MA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHxwZXQlMjBzaG9wfGVufDB8fHx8MTc2NzU0OTEwN3ww&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1595180017128-4ad0190fa7bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxMHx8Z3Jvb21pbmd8ZW58MHx8fHwxNzY3NTQ5MTA3fDA&ixlib=rb-4.1.0&q=80&w=1080",
];

export function StoreCarousel() {
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!api) {
      return;
    }

    const intervalId = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 4000); // 4 seconds interval to change photos

    return () => clearInterval(intervalId);
  }, [api]);

  return (
    <div className="relative w-full max-w-4xl mx-auto px-12">
      <Carousel setApi={setApi} opts={{ loop: true }}>
        <CarouselContent>
          {storeImages.map((src, index) => (
            <CarouselItem key={index}>
              <div className="relative aspect-video w-full overflow-hidden rounded-xl shadow-lg border border-primary/20">
                <Image 
                  src={src} 
                  alt={`Sua loja foto ${index + 1}`} 
                  fill 
                  className="object-cover"
                  priority={index === 0}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-4 md:-left-12 opacity-80 hover:opacity-100" />
        <CarouselNext className="-right-4 md:-right-12 opacity-80 hover:opacity-100" />
      </Carousel>
    </div>
  );
}
