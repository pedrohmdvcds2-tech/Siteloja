'use client';

import { useState } from 'react';
import { Bot, User, Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { answerQuestion } from '@/ai/flows/pet-spa-agent';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const predefinedQuestions = [
  'Como funciona o banho de vocês?',
  'Vocês têm algum pacote de banhos (clubinho)?',
  'Quais são os meios de comunicação?',
];

export function AiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (question: string) => {
    if (!question.trim()) return;

    const userMessage: Message = { role: 'user', content: question };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInput('');

    try {
      const response = await answerQuestion({ question });
      const assistantMessage: Message = { role: 'assistant', content: response.answer };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Desculpe, algo deu errado ao tentar processar sua pergunta. Tente novamente.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  return (
    <Card className="w-full shadow-xl mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-bold">
          <Bot className="text-primary" />
          Converse com nosso Assistente de IA
        </CardTitle>
        <CardDescription>
          Tire suas dúvidas sobre nossos serviços. Comece com uma das sugestões abaixo ou digite sua pergunta.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-64 w-full rounded-md border p-4">
          <div className="flex flex-col gap-4">
            {messages.length === 0 && (
                <div className="text-center text-muted-foreground p-8">
                    <Sparkles className="mx-auto h-8 w-8 mb-2" />
                    <p>Nenhuma mensagem ainda. Faça uma pergunta!</p>
                </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-start gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Bot size={20} />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-xs md:max-w-md lg:max-w-lg rounded-lg p-3 text-sm',
                    message.role === 'user'
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {message.content}
                </div>
                 {message.role === 'user' && (
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                    <User size={20} />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-3 justify-start">
                 <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Bot size={20} />
                  </div>
                <div className="bg-muted rounded-lg p-3 text-sm flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Digitando...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <div className="flex flex-wrap gap-2">
          {predefinedQuestions.map(q => (
            <Button
              key={q}
              variant="outline"
              size="sm"
              onClick={() => handleSendMessage(q)}
              disabled={isLoading}
            >
              {q}
            </Button>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
          <Input
            type="text"
            placeholder="Digite sua pergunta aqui..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            <Send size={16} />
            <span className="sr-only">Enviar</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
