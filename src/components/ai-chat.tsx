'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle } from 'lucide-react';

const faqData = [
  {
    id: 'faq-1',
    question: 'Como funcionam os banhos de vocês?',
    answer: 'Nossos banhos são realizados com o máximo de cuidado e por profissionais 100% capacitados, garantindo o bem-estar e a segurança do seu pet.',
  },
  {
    id: 'faq-2',
    question: 'Vocês têm algum pacote de banhos (clubinho)?',
    answer: (
      <div className="space-y-2">
        <p>Sim, nós temos um pacote de banhos chamado "Clubinho". O pacote consiste em um ciclo de 4 banhos e inclui os seguintes benefícios:</p>
        <ul className="list-disc list-inside pl-4 space-y-1 text-sm">
          <li>Cromoterapia em todos os banhos.</li>
          <li>4 escovações de dente.</li>
          <li>1 tosa higiênica (ou retirada de subpelos para pets de pelo curto).</li>
          <li>Corte de unhas.</li>
          <li>Limpeza de ouvidos.</li>
          <li>Serviço de Taxi Dog (a disponibilidade para a localização do cliente deve ser confirmada diretamente via WhatsApp).</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'faq-3',
    question: 'Quais são os meios de comunicação?',
    answer: (
      <div className="space-y-2">
        <p>Você pode entrar em contato conosco através dos nossos canais oficiais. Nosso principal canal para dúvidas e agendamentos é o WhatsApp.</p>
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
              href="https://www.instagram.com/princesaspetshop"
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

export function Faq() {
  return (
    <Card className="w-full shadow-xl mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-bold">
          <HelpCircle className="text-primary" />
          Perguntas Frequentes
        </CardTitle>
        <CardDescription>
          Tire suas dúvidas sobre nossos serviços clicando nas perguntas abaixo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {faqData.map((item) => (
            <AccordionItem value={item.id} key={item.id}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>
                <div className="text-muted-foreground">{item.answer}</div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
