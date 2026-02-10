'use client';

import { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const faqData = [
  {
    id: 'faq-1',
    question: 'Como funcionam os banhos de vocês?',
    answer:
      'Nossos banhos são realizados com o máximo de cuidado e por profissionais 100% capacitados, garantindo o bem-estar e a segurança do seu pet.',
  },
  {
    id: 'faq-2',
    question: 'Vocês têm algum pacote de banhos (clubinho)?',
    answer: (
      <div className="space-y-2">
        <p>
          Sim, nós temos um pacote de banhos chamado "Clubinho". O pacote
          consiste em um ciclo de 4 banhos e inclui os seguintes benefícios:
        </p>
        <ul className="list-disc list-inside pl-4 space-y-1 text-sm">
          <li>Cromoterapia em todos os banhos.</li>
          <li>4 escovações de dente.</li>
          <li>
            1 tosa higiênica (ou retirada de subpelos para pets de pelo curto).
          </li>
          <li>Corte de unhas.</li>
          <li>Limpeza de ouvidos.</li>
          <li>
            Serviço de Taxi Dog (a disponibilidade para a localização do cliente
            deve ser confirmada diretamente via WhatsApp).
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'faq-3',
    question: 'Quais são os meios de comunicação?',
    answer: (
      <div className="space-y-2">
        <p>
          Você pode entrar em contato conosco através dos nossos canais
          oficiais. Nosso principal canal para dúvidas e agendamentos é o
          WhatsApp.
        </p>
        <ul className="list-disc list-inside pl-4 space-y-1 text-sm">
          <li>
            <strong>WhatsApp:</strong>{' '}
            <a
              href="https://wa.me/552136538610"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              (21) 3653-8610
            </a>
          </li>
          <li>
            <strong>Instagram:</strong>{' '}
            <a
              href="https://www.instagram.com/princesaspetshop/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              @princesaspetshop
            </a>
          </li>
          <li>
            <strong>Facebook:</strong>{' '}
            <a
              href="https://www.facebook.com/princesaspetshop"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              /princesaspetshop
            </a>
          </li>
        </ul>
      </div>
    ),
  },
];


const TypingIndicator = () => (
    <div className="flex items-center space-x-1.5 p-2">
        <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 rounded-full bg-primary/50 animate-pulse"></div>
    </div>
);

interface AnswerBubbleProps {
    answer: React.ReactNode;
}

const AnswerBubble: React.FC<AnswerBubbleProps> = ({ answer }) => {
    const [isTyping, setIsTyping] = useState(true);

    useEffect(() => {
        setIsTyping(true); 
        const timer = setTimeout(() => {
            setIsTyping(false);
        }, 1200 + Math.random() * 500); 

        return () => clearTimeout(timer);
    }, [answer]);

    return (
        <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8 border-2 border-primary/50 shadow-sm">
              <AvatarImage src="https://i.imgur.com/SLxSDoD.png" alt="Princesa, a assistente virtual" />
              <AvatarFallback>P</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <p className="font-bold text-primary mb-1">Princesa</p>
                <div className="text-muted-foreground p-4 bg-secondary/50 rounded-lg rounded-tl-none min-h-[48px] flex items-center">
                    {isTyping ? <TypingIndicator /> : answer}
                </div>
            </div>
        </div>
    );
};


export function Faq() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-xl z-50 shimmer transition-transform duration-200 hover:scale-110">
          <Sparkles className="h-8 w-8" />
          <span className="sr-only">Abrir assistente virtual</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-2xl font-bold">
            <Sparkles className="text-primary" />
            Assistente Virtual
          </SheetTitle>
          <SheetDescription>
            Eu me chamo Princesa! Clique em uma pergunta para eu poder te ajudar.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-grow overflow-y-auto py-4 -mx-6 px-6">
          <Accordion type="single" collapsible className="w-full space-y-2">
            {faqData.map((item) => (
              <AccordionItem value={item.id} key={item.id} className="border-b-0">
                <AccordionTrigger className="text-left hover:no-underline border rounded-lg px-4 data-[state=open]:border-primary data-[state=open]:bg-accent/50 transition-all">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="pt-4 px-1">
                  <AnswerBubble key={item.id} answer={item.answer} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </SheetContent>
    </Sheet>
  );
}