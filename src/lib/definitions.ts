import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];


export const formSchema = z.object({
  clientName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres."),
  petName: z.string().min(2, "Nome do pet deve ter pelo menos 2 caracteres."),
  petBreed: z.string().min(2, "Raça deve ter pelo menos 2 caracteres."),
  petSize: z.enum(["pequeno", "medio", "grande"], {
    required_error: "Selecione o porte do pet.",
  }),
  contact: z.string().min(10, "Número de contato parece curto demais."),
  vaccinationStatus: z.enum(["Em dia", "Não está em dia"],{
    required_error: "Selecione o status da vacinação.",
  }),
  isMatted: z.boolean().default(false),
  appointmentDate: z.date({
    required_error: "Selecione uma data para o agendamento.",
  }),
  appointmentTime: z.string({
    required_error: "Selecione um horário.",
  }),
  bathType: z.string({
    required_error: "Selecione um tipo de banho.",
  }),
  extras: z.object({
    hydration: z.boolean().default(false),
    ozoneBath: z.boolean().default(false),
    teethBrushing: z.boolean().default(false),
  }),
  observations: z.string().optional(),
}).refine(data => {
  // Se a vacina não está em dia, o formulário é inválido no geral.
  return data.vaccinationStatus !== 'Não está em dia';
}, {
  message: "A vacinação do pet precisa estar em dia para realizar o agendamento.",
  path: ["vaccinationStatus"], 
});

export const recurringBlockSchema = z.object({
  dayOfWeek: z.string().min(1, "Por favor, selecione um dia da semana."),
  time: z.string().min(1, "Por favor, selecione um horário."),
  petName: z.string().min(2, "O nome do pet deve ter pelo menos 2 caracteres."),
  label: z.string().default('Clubinho'),
  frequency: z.enum(['weekly', 'bi-weekly'], {
    required_error: 'Selecione a frequência.'
  }),
  startDate: z.date({
    required_error: 'Selecione uma data de início.'
  }),
});

export type RecurringBlockValues = z.infer<typeof recurringBlockSchema>;


export type SchedulingFormValues = z.infer<typeof formSchema>;
