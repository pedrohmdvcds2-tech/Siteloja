"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  User,
  Dog,
  Phone,
  Syringe,
  Scissors,
  Sparkles,
  HelpingHand,
  Clock,
  CircleDollarSign,
  CalendarDays,
  Tag,
  Scale,
  MessageCircle,
  FileText,
  Wind,
  AlertTriangle,
  CalendarIcon,
  Upload,
} from "lucide-react";


import { formSchema, type SchedulingFormValues } from "@/lib/definitions";
import { cn, generateTimeSlots } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import {
  initiateAnonymousSignIn,
} from "@/firebase";
import { collection, query, where, addDoc, doc, setDoc } from "firebase/firestore";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";

const PRICES = {
  bath: {
    "Banho Simples": 30,
    "Banho Terapêutico": 45,
    "Banho e Tosa": 60,
  },
  sizeMultiplier: {
    pequeno: 1,
    medio: 1.25,
    grande: 1.5,
  },
  extras: {
    hydration: 20,
    ozoneBath: 25,
    teethBrushing: 15,
  },
};

const bathTypes = ["Banho Simples", "Banho Terapêutico", "Banho e Tosa"];
const allTimeSlots = generateTimeSlots();

export function SchedulingForm() {
  const [totalPrice, setTotalPrice] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { firestore, auth, user, isUserLoading } = useFirebase();

  useEffect(() => {
    if (!user && !isUserLoading) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, auth, isUserLoading]);

  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore || !selectedDate) return null;
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    return query(
      collection(firestore, "appointments"),
      where("startTime", ">=", startOfDay.toISOString()),
      where("startTime", "<=", endOfDay.toISOString())
    );
  }, [firestore, selectedDate]);

  const { data: todaysAppointments, isLoading: isLoadingAppointments } =
    useCollection(appointmentsQuery);

  const availableTimeSlots = useMemo(() => {
    if (!todaysAppointments) {
      return allTimeSlots;
    }
    const bookedOrBlockedTimes = todaysAppointments.map((apt) =>
      format(new Date(apt.startTime), "HH:mm")
    );
    return allTimeSlots.filter(
      (slot) => !bookedOrBlockedTimes.includes(slot)
    );
  }, [todaysAppointments]);

  const form = useForm<SchedulingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "",
      petName: "",
      petBreed: "",
      contact: "",
      vaccinationStatus: undefined,
      isMatted: false,
      bathType: undefined,
      petSize: undefined,
      appointmentDate: undefined,
      appointmentTime: undefined,
      extras: {
        hydration: false,
        ozoneBath: false,
        teethBrushing: false,
      },
      observations: "",
    },
  });

  const watchedValues = form.watch();

  useEffect(() => {
    const calculatePrice = () => {
      const { bathType, petSize, extras } = watchedValues;
      if (!bathType || !petSize) {
        return 0;
      }

      const basePrice = PRICES.bath[bathType as keyof typeof PRICES.bath] || 0;
      const sizeAdjustedPrice =
        basePrice *
        (PRICES.sizeMultiplier[
          petSize as keyof typeof PRICES.sizeMultiplier
        ] || 1);

      let extrasPrice = 0;
      if (extras?.hydration) extrasPrice += PRICES.extras.hydration;
      if (extras?.ozoneBath) extrasPrice += PRICES.extras.ozoneBath;
      if (extras?.teethBrushing) extrasPrice += PRICES.extras.teethBrushing;
      
      return sizeAdjustedPrice + extrasPrice;
    };

    const newPrice = calculatePrice();
    setTotalPrice(newPrice);
  }, [watchedValues]);

  useEffect(() => {
    if (watchedValues.appointmentDate) {
      const newDate = new Date(watchedValues.appointmentDate);
      if (selectedDate?.getTime() !== newDate.getTime()) {
        setSelectedDate(newDate);
        form.setValue("appointmentTime", undefined); // Reset time when date changes
      }
    }
  }, [watchedValues.appointmentDate, selectedDate, form]);

  async function onSubmit(data: SchedulingFormValues) {
    setIsSubmitting(true);
    if (!user || !firestore) {
      toast({
        variant: "destructive",
        title: "Erro de Autenticação",
        description: "Não foi possível identificar o usuário. Tente recarregar a página.",
      });
      setIsSubmitting(false);
      return;
    }
  
    try {
      const { appointmentDate, appointmentTime } = data;
      const [hours, minutes] = appointmentTime.split(':').map(Number);
      const startTime = new Date(appointmentDate);
      startTime.setHours(hours, minutes, 0, 0);
      const endTime = new Date(startTime.getTime() + 30 * 60000); 
      
      const newAppointment = {
        userId: user.uid,
        clientName: data.clientName,
        petName: data.petName,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        bathType: data.bathType,
        additionalServices: Object.entries(data.extras)
          .filter(([, value]) => value)
          .map(([key]) => key),
        totalPrice: totalPrice,
        blocked: false,
        vaccinationCardUrl: "", // Campo mantido para consistência do schema, mas vazio.
      };
  
      await addDoc(collection(firestore, "appointments"), newAppointment);
      
      toast({
        title: "Agendamento Registrado!",
        description: "Agora abra o WhatsApp para confirmar o envio da sua mensagem.",
      });
  
      const phoneNumber = "5521993413747";
      const formattedDate = format(data.appointmentDate, "dd/MM/yyyy", { locale: ptBR });
      
      const message = `🐕 *NOVO AGENDAMENTO - Princesas Pet Shop*

📋 *Dados do Cliente*
Nome: ${data.clientName}
Telefone: ${data.contact}

🐶 *Dados do Cachorro*
Nome: ${data.petName}
Porte: ${data.petSize}
Vacinação: ${data.vaccinationStatus}
${data.isMatted ? '⚠️ Animal está embolado (requer avaliação presencial)' : ''}
${data.vaccinationStatus === 'Em dia' ? '❗️ Carteira de vacinação a ser apresentada no local.' : ''}

📅 *Agendamento*
Data: ${formattedDate}
Horário: ${data.appointmentTime}

✨ *Serviço*
Tipo: ${data.bathType}
${data.extras.hydration ? `Hidratação: Sim (+R$${PRICES.extras.hydration.toFixed(2).replace('.',',')})` : 'Hidratação: Não'}
${data.extras.ozoneBath ? `Banho com Ozônio: Sim (+R$${PRICES.extras.ozoneBath.toFixed(2).replace('.',',')})` : 'Banho com Ozônio: Não'}
${data.extras.teethBrushing ? `Escovação dental: Sim (+R$${PRICES.extras.teethBrushing.toFixed(2).replace('.',',')})` : 'Escovação dental: Não'}

${data.observations ? `\n💡 *Observações:* ${data.observations}` : ''}

💰 *Valor Total: R$ ${totalPrice.toFixed(2).replace(".", ",")}*
${data.isMatted ? '💡 Obs: Valor pode variar devido ao embolamento' : ''}

---
Agendamento realizado através do site.`;
  
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_self");
  
      form.reset();
      setSelectedDate(undefined);
  
    } catch (e: any) {
      console.error("Error during submission: ", e);
      toast({
        variant: "destructive",
        title: "Erro ao Agendar!",
        description: e.message || "Não foi possível salvar seu agendamento. Por favor, tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const isVaccinationOk = watchedValues.vaccinationStatus === 'Em dia';

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-bold">
          <CalendarDays />
          Formulário de Agendamento
        </CardTitle>
        <CardDescription>
          Preencha os dados abaixo para reservar um horário para o seu pet.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <h3 className="font-headline font-semibold text-lg flex items-center gap-2 text-primary">
                <User />
                Dados do Tutor e do Pet
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="clientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Tutor</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contato (WhatsApp)</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="(99) 99999-9999"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="petName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Pet</FormLabel>
                      <FormControl>
                        <Input placeholder="O nome do seu amigo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="petBreed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Raça do Pet</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Golden Retriever" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <FormField
                  control={form.control}
                  name="petSize"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="flex items-center gap-2">
                        <Scale />
                        Porte do Pet
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="pequeno" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Pequeno
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="medio" />
                            </FormControl>
                            <FormLabel className="font-normal">Médio</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="grande" />
                            </FormControl>
                            <FormLabel className="font-normal">Grande</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vaccinationStatus"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="flex items-center gap-2">
                        <Syringe />
                        Vacinação
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-2"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Em dia" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Em dia
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="Não está em dia" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Não está em dia
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                       <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
                {watchedValues.vaccinationStatus === 'Não está em dia' && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Vacinação Obrigatória</AlertTitle>
                    <AlertDescription>
                      Para a segurança de todos os pets, a vacinação deve estar em dia para agendar qualquer serviço.
                    </AlertDescription>
                  </Alert>
                )}
                {isVaccinationOk && (
                  <Alert className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Apresentar Carteirinha</AlertTitle>
                    <AlertDescription>
                      Lembre-se de apresentar a carteira de vacinação do seu pet no dia do atendimento.
                    </AlertDescription>
                  </Alert>
                )}
              <div className="pt-4">
                 <FormField
                  control={form.control}
                  name="isMatted"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>
                          Seu pet está com nós/embolado?
                        </FormLabel>
                        <FormDescription>
                          A remoção de nós exige tempo e cuidado extra.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {watchedValues.isMatted && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Avaliação Necessária</AlertTitle>
                    <AlertDescription>
                      A necessidade e o valor da taxa de desembolo serão confirmados por nossa equipe durante a avaliação presencial do pet.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-headline font-semibold text-lg flex items-center gap-2 text-primary">
                <Scissors /> Escolha dos Serviços
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="bathType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Banho</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o banho principal" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {bathTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-3">
                  <FormLabel>Serviços Adicionais</FormLabel>
                  <div className="flex flex-col gap-2">
                    <FormField
                      control={form.control}
                      name="extras.hydration"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="font-normal">
                              Hidratação (+R$
                              {PRICES.extras.hydration.toFixed(2).replace(".", ",")}
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="extras.ozoneBath"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                          <FormLabel className="font-normal">
                            Banho com Ozônio (+R$
                            {PRICES.extras.ozoneBath.toFixed(2).replace(".", ",")}
                          </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="extras.teethBrushing"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                          <FormLabel className="font-normal">
                            Escovação de Dentes (+R$
                            {PRICES.extras.teethBrushing.toFixed(2).replace(".", ",")}
                          </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText />
                      Observações
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: Meu pet tem alergia a algum produto ou precisa de atenção especial?"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="font-headline font-semibold text-lg flex items-center gap-2 text-primary">
                <Clock /> Data e Hora
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="appointmentDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data do Agendamento</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: ptBR })
                              ) : (
                                <span>Escolha uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            locale={ptBR}
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                              date.getDay() === 0
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="appointmentTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário Disponível</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!watchedValues.appointmentDate || watchedValues.vaccinationStatus === 'Não está em dia'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um horário" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingAppointments ? (
                            <SelectItem value="loading" disabled>
                              Carregando...
                            </SelectItem>
                          ) : availableTimeSlots.length > 0 ? (
                            availableTimeSlots.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-slots" disabled>
                              Nenhum horário vago
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/50 p-6 rounded-b-lg">
            <div className="flex items-center gap-3">
              <CircleDollarSign className="size-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Valor Total Estimado
                </p>
                <p className="text-2xl font-bold">
                  R$${totalPrice.toFixed(2).replace(".", ",")}
                </p>
              </div>
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full md:w-auto shimmer transition-transform duration-200 hover:scale-105"
              disabled={isUserLoading || isLoadingAppointments || isSubmitting || watchedValues.vaccinationStatus === 'Não está em dia'}
            >
              {isSubmitting ? 'Enviando...' : <><MessageCircle /> Agendar via WhatsApp</>}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
