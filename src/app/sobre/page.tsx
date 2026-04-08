import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StoreCarousel } from "@/components/store-carousel";
import { MapPin, ArrowLeft, Clock, History } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "A Loja | Princesas Pet Shop",
  description: "Conheça a história e o espaço do Princesas Pet Shop.",
};

export default function SobrePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-body text-foreground">
      <PageHeader />

      <main className="flex-grow w-full max-w-5xl mx-auto p-4 md:p-8 space-y-16 mt-4">
        <div className="flex items-center">
          <Link href="/" className="text-primary hover:underline flex items-center gap-2 font-medium">
            <ArrowLeft className="w-5 h-5" /> Voltar para o início
          </Link>
        </div>

        <section className="space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl md:text-5xl font-extrabold font-headline text-primary tracking-tight">
              Conheça o Nosso Espaço
            </h2>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
              Ambiente preparado com muito carinho e higiene para receber o seu melhor amigo.
            </p>
          </div>
          <StoreCarousel />
        </section>

        <section className="relative px-6 py-12 md:p-12 bg-primary/5 rounded-3xl border border-primary/10 overflow-hidden shadow-sm">
          <div className="relative z-10 space-y-6 max-w-4xl mx-auto text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-extrabold font-headline text-primary flex items-center gap-3 justify-center md:justify-start">
              <History className="w-8 h-8" /> Nossa História
            </h2>
            <div className="space-y-5 text-lg text-foreground/80 leading-relaxed font-medium">
              <p>
                O <strong>Princesas Pet Shop</strong> nasceu do amor incondicional pelos animais. 
                Nossa missão sempre foi proporcionar um ambiente seguro, acolhedor e cheio de carinho para cada pet.
              </p>
              <p>
                Com profissionais dedicados e apaixonados pelo que fazem, fomos crescendo e nos tornando
                referência no cuidado animal na nossa região. Acreditamos que cada pet é único e merece um
                tratamento de realeza!
              </p>
              <p>
                Aqui, nós não apenas damos banho ou tosamos, nós cuidamos do bem-estar, da saúde e da alegria
                dos nossos clientes de quatro patas. Venha nos fazer uma visita e conhecer a nossa família!
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="space-y-6 p-8 rounded-2xl shadow-lg border border-border bg-card transition-all hover:shadow-xl">
            <h2 className="text-2xl font-extrabold font-headline text-primary flex items-center gap-2">
              <MapPin className="w-6 h-6 text-primary" /> Onde Estamos
            </h2>
            <div className="text-lg text-muted-foreground space-y-2">
              <p className="font-semibold text-foreground text-xl">Princesas Pet Shop</p>
              <p>Av. Das Princesas, 1000 - Loja A</p>
              <p>Bairro Imperial, Cidade - Estado</p>
              <p>CEP: 00000-000</p>
              <p className="mt-6 text-sm flex items-center gap-2 text-primary/80 bg-primary/10 p-3 rounded-lg">
                🚗 Temos estacionamento no local para sua conveniência.
              </p>
            </div>
          </div>

          <div className="space-y-6 p-8 rounded-2xl shadow-lg border border-border bg-card transition-all hover:shadow-xl">
            <h2 className="text-2xl font-extrabold font-headline text-primary flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary" /> Horário de Funcionamento
            </h2>
            <div className="text-lg text-muted-foreground space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-medium">Segunda a Sexta:</span>
                <span>08:00 às 18:00</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="font-medium">Sábado:</span>
                <span>08:00 às 14:00</span>
              </div>
              <div className="flex justify-between items-center text-red-500/80 font-medium pb-2">
                <span>Domingos e Feriados:</span>
                <span>Fechado</span>
              </div>
              <p className="mt-4 text-sm bg-muted p-3 rounded-lg text-center">
                Atendemos por ordem de chegada ou agendamento.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full text-center p-6 text-sm text-muted-foreground mt-8 bg-muted/30">
        <p>
          &copy; {new Date().getFullYear()} Princesas Pet Shop. Todos os
          direitos reservados.
        </p>
      </footer>
    </div>
  );
}
