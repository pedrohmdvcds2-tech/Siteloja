'use server';
/**
 * @fileOverview AI agent for answering questions about Pet Spa services.
 *
 * - answerQuestion: A function that handles the question answering process.
 * - PetSpaAgentInput: The input type for the answerQuestion function.
 * - PetSpaAgentOutput: The return type for the answerQuestion function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PetSpaAgentInputSchema = z.object({
  question: z.string().describe("The user's question about the pet spa."),
});
export type PetSpaAgentInput = z.infer<typeof PetSpaAgentInputSchema>;

const PetSpaAgentOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer.'),
});
export type PetSpaAgentOutput = z.infer<typeof PetSpaAgentOutputSchema>;

export async function answerQuestion(input: PetSpaAgentInput): Promise<PetSpaAgentOutput> {
  return petSpaAgentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'petSpaAgentPrompt',
  input: { schema: PetSpaAgentInputSchema },
  output: { schema: PetSpaAgentOutputSchema },
  system: `Você é um assistente virtual do "Princesas Pet Shop". Sua principal função é responder perguntas sobre nossos serviços de forma amigável, prestativa e direta, baseando-se *estritamente* nas informações fornecidas abaixo. Não invente ou presuma nenhuma informação que não esteja aqui. Se a pergunta não puder ser respondida com as informações abaixo, gentilmente informe ao usuário que você não tem essa informação e sugira que ele entre em contato via WhatsApp.

**Nossa Base de Conhecimento:**

1.  **Como funcionam os banhos:**
    *   Nossos banhos são realizados com o máximo de cuidado e por profissionais 100% capacitados, garantindo o bem-estar e a segurança do seu pet.

2.  **Clubinho (Nosso Pacote de Banhos):**
    *   Sim, nós temos um pacote de banhos chamado "Clubinho".
    *   O pacote consiste em um ciclo de 4 banhos.
    *   Benefícios inclusos no ciclo de 4 banhos:
        *   Cromoterapia em todos os banhos.
        *   4 escovações de dente.
        *   1 tosa higiênica (ou retirada de subpelos para pets de pelo curto).
        *   Corte de unhas.
        *   Limpeza de ouvidos.
        *   Serviço de Taxi Dog (a disponibilidade para a localização do cliente deve ser confirmada diretamente via WhatsApp).

3.  **Meios de Comunicação:**
    *   Nosso principal canal de comunicação para dúvidas, agendamentos e confirmação da área de cobertura do Taxi Dog é o WhatsApp.`,
  prompt: 'Por favor, responda a seguinte pergunta: {{{question}}}',
});

const petSpaAgentFlow = ai.defineFlow(
  {
    name: 'petSpaAgentFlow',
    inputSchema: PetSpaAgentInputSchema,
    outputSchema: PetSpaAgentOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
