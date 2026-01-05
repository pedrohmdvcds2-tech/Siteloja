"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CalendarIcon,
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import {
  addDocumentNonBlocking,
  signInAnonymously,
  initiateAnonymousSignIn,
} from "@/firebase";
import { collection, query, where } from "firebase/firestore";

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
    nailTrimming: 10,
    hydration: 20,
    earCleaning: 15,
  },
};

const bathTypes = ["Banho Simples", "Banho Terapêutico", "Banho e Tosa"];
const allTimeSlots = generateTimeSlots();

export function SchedulingForm() {
  const [totalPrice, setTotalPrice] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const { toast } = useToast();
  const { firestore, auth, user, isUserLoading } = useFirebase();

  useEffect(() => {
    if (!isUserLoading && !user) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

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

  const availableTimeSlots = useMemoFirebase(() => {
    if (!todaysAppointments) {
      return allTimeSlots;
    }
    const bookedTimes = todaysAppointments.map((apt) =>
      format(new Date(apt.startTime), "HH:mm")
    );
    return allTimeSlots.filter(
      (slot) =>
        !bookedTimes.includes(slot) &&
        !todaysAppointments.find((a) => a.blocked && format(new Date(a.startTime), 'HH:mm') === slot)
    );
  }, [todaysAppointments]);

  const form = useForm<SchedulingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: "",
      petName: "",
      petBreed: "",
      contact: "",
      isVaccinated: true,
      bathType: undefined,
      petSize: undefined,
      appointmentTime: undefined,
      extras: {
        nailTrimming: false,
        hydration: false,
        earCleaning: false,
      },
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
      if (extras?.nailTrimming) extrasPrice += PRICES.extras.nailTrimming;
      if (extras?.hydration) extrasPrice += PRICES.extras.hydration;
      if (extras?.earCleaning) extrasPrice += PRICES.extras.earCleaning;

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
    if (!firestore || !user) {
      toast({
        variant: "destructive",
        title: "Erro de autenticação",
        description: "Por favor, recarregue a página e tente novamente.",
      });
      return;
    }

    const [hours, minutes] = data.appointmentTime.split(":").map(Number);
    const startTime = new Date(data.appointmentDate);
    startTime.setHours(hours, minutes, 0, 0);
    const endTime = new Date(startTime.getTime() + 30 * 60000); // Assuming 30 min slots

    const newAppointment = {
      ...data,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      totalPrice: totalPrice,
      blocked: false, // Appointments are not blocked by default
      userId: user.uid,
    };

    try {
      const appointmentsCol = collection(firestore, "appointments");
      await addDocumentNonBlocking(appointmentsCol, newAppointment);

      toast({
        title: "Agendamento realizado com sucesso! ✅",
        description: `Seu horário para ${data.petName} no dia ${format(
          startTime,
          "PPP",
          { locale: ptBR }
        )} às ${data.appointmentTime} foi confirmado.`,
      });
      form.reset();
    } catch (e: any) {
      console.error("Error adding document: ", e);
      toast({
        variant: "destructive",
        title: "Ops! Algo deu errado.",
        description: "Não foi possível realizar o agendamento. Tente novamente.",
      });
    }
  }

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl font-bold">
          <CalendarDays className="text-gold" />
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
                <User /> Dados do Tutor e do Pet
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
                        <Scale className="size-4" />
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
                  name="isVaccinated"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="flex items-center gap-2">
                          <Syringe className="size-4" />
                          Vacinação em dia?
                        </FormLabel>
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
                      name="extras.nailTrimming"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Corte de Unhas (+R$
                            {PRICES.extras.nailTrimming.toFixed(2).replace(".", ",")})
                          </FormLabel>
                        </FormItem>
                      )}
                    />
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
                          <FormLabel className="font-normal">
                            Hidratação de Pelos (+R$
                            {PRICES.extras.hydration.toFixed(2).replace(".", ",")})
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="extras.earCleaning"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Limpeza de Ouvidos (+R$
                            {PRICES.extras.earCleaning.toFixed(2).replace(".", ",")})
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
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
                  R${totalPrice.toFixed(2).replace(".", ",")}
                </p>
              </div>
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full md:w-auto shimmer transition-transform duration-200 hover:scale-105"
              disabled={isUserLoading || isLoadingAppointments}
            >
              <MessageCircle className="mr-2" /> Agendar
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
