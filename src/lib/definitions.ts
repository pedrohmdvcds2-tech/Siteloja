import { z } from "zod";

const MAX_FILE_SIZE = 5000000; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];


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
  vaccinationCard: z.any()
    .refine((file) => file, "A foto da carteira de vacinação é obrigatória.")
    .refine((file) => file?.size <= MAX_FILE_SIZE, `O tamanho máximo do arquivo é 5MB.`)
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
      "Formato de arquivo inválido. Apenas .jpg, .jpeg, .png, .webp e .pdf são aceitos."
    ).nullable(),
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
}).refine(data => data.vaccinationStatus === 'Em dia', {
  message: "A vacinação do pet precisa estar em dia para realizar o agendamento.",
  path: ["vaccinationStatus"],
}).refine(data => {
  if (data.vaccinationStatus === 'Em dia') {
    return !!data.vaccinationCard;
  }
  return true;
}, {
  message: "A foto da carteira de vacinação é obrigatória.",
  path: ["vaccinationCard"],
});


export type SchedulingFormValues = z.infer<typeof formSchema>;
