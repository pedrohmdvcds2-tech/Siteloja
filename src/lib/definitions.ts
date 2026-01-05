import { z } from "zod";

export const formSchema = z.object({
  clientName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres."),
  petName: z.string().min(2, "Nome do pet deve ter pelo menos 2 caracteres."),
  petBreed: z.string().min(2, "Raça deve ter pelo menos 2 caracteres."),
  petSize: z.enum(["pequeno", "medio", "grande"], {
    required_error: "Selecione o porte do pet.",
  }),
  contact: z.string().min(10, "Número de contato parece curto demais."),
  vaccinationStatus: z.string({
    required_error: "Selecione o status da vacinação.",
  }),
  vaccinationCard: z.any().optional(),
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
});

export type SchedulingFormValues = z.infer<typeof formSchema>;
