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
  vaccinationCard: z
    .any()
    .refine((files) => files?.length === 1 ? files?.[0].size <= MAX_FILE_SIZE : true, `O tamanho máximo é 5MB.`)
    .refine(
      (files) => files?.length === 1 ? ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type) : true,
      "Apenas os formatos .jpg, .jpeg, .png, .webp e .pdf são aceitos."
    )
    .optional(),
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
}).refine(data => {
    // Se a vacina está em dia, o upload é obrigatório.
    if (data.vaccinationStatus === 'Em dia') {
        return data.vaccinationCard && data.vaccinationCard.length > 0;
    }
    // Se não está em dia, a validação principal já vai falhar, mas aqui retornamos true para não sobrepor o erro.
    return true;
}, {
    message: "É necessário enviar a carteira de vacinação se a vacina está em dia.",
    path: ["vaccinationCard"],
});


export type SchedulingFormValues = z.infer<typeof formSchema>;
