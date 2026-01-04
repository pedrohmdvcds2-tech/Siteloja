import { z } from "zod";

export const formSchema = z.object({
  clientName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres."),
  petName: z.string().min(2, "Nome do pet deve ter pelo menos 2 caracteres."),
  petBreed: z.string().min(2, "Raça deve ter pelo menos 2 caracteres."),
  petSize: z.enum(["pequeno", "medio", "grande"], {
    required_error: "Selecione o porte do pet.",
  }),
  contact: z.string().min(10, "Número de contato parece curto demais."),
  isVaccinated: z.boolean().default(false),
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
    nailTrimming: z.boolean().default(false),
    hydration: z.boolean().default(false),
    earCleaning: z.boolean().default(false),
  }),
});

export type SchedulingFormValues = z.infer<typeof formSchema>;
