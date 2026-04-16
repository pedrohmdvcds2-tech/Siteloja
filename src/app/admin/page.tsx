'use client';
import { useUser, useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  collection,
  doc,
  deleteDoc,
  query,
  addDoc,
  writeBatch,
  where,
} from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, getWeek, startOfDay, isEqual } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LogOut, Calendar as CalendarIcon, Trash2, CalendarClock, Repeat, CalendarCheck2, Star, Lock, Eye, Clock } from 'lucide-react';
import { signOut } from 'firebase/auth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn, generateTimeSlots, getDayOfWeekName } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { recurringBlockSchema, type RecurringBlockValues } from '@/lib/definitions';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { BulkImporter } from '@/components/bulk-importer';
import { useDoc } from '@/firebase';


export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const { firestore, auth } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isBlockingDays, setIsBlockingDays] = useState(false);
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [selectedSpecificDate, setSelectedSpecificDate] = useState<Date | undefined>(undefined);
  const [selectedSpecificTime, setSelectedSpecificTime] = useState<string>('');
  const [isBlockingTime, setIsBlockingTime] = useState(false);

  const ADMIN_EMAILS = ['admin@princesaspetshop.com.br'];

  const form = useForm<RecurringBlockValues>({
    resolver: zodResolver(recurringBlockSchema),
    defaultValues: {
      dayOfWeek: '',
      time: '',
      petName: '',
      label: 'Clubinho',
      frequency: 'weekly',
      cycleStartDate: new Date(),
      startBathNumber: 1,
    },
  });
  
  const watchedFrequency = form.watch('frequency');

  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(
      collection(firestore, 'appointments'),
       where('bathType', '!=', 'BLOQUEIO')
    );
  }, [firestore, isAdmin]);
  
  const blockedDaysQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(
      collection(firestore, 'appointments'),
      where('bathType', '==', 'BLOQUEIO')
    );
  }, [firestore, isAdmin]);

  const blockedTimesQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(
      collection(firestore, 'appointments'),
      where('bathType', '==', 'BLOQUEIO_HORARIO')
    );
  }, [firestore, isAdmin]);

  const recurringBlocksQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return collection(firestore, 'recurringBlocks');
  }, [firestore, isAdmin]);

  const today = new Date();
  const dateString = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

  const dailyVisitsDocQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'stats', `visits-${dateString}`);
  }, [firestore, dateString]);

  const {
    data: appointments,
    isLoading: isLoadingAppointments,
    error,
  } = useCollection(appointmentsQuery);

  const { 
    data: blockedDayAppointments, 
    isLoading: isLoadingBlockedDays, 
    refetch: refetchBlockedDays 
  } = useCollection(blockedDaysQuery);

  const { 
    data: blockedTimeAppointments, 
    isLoading: isLoadingBlockedTimes, 
    refetch: refetchBlockedTimes 
  } = useCollection(blockedTimesQuery);

  const {
    data: recurringBlocks,
    isLoading: isLoadingRecurring,
    error: recurringError,
    refetch: refetchRecurring,
  } = useCollection(recurringBlocksQuery);
  
  const { data: dailyVisitsData, isLoading: isLoadingDailyVisits } = useDoc(dailyVisitsDocQuery);


  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        setIsAdmin(ADMIN_EMAILS.includes(user.email || ''));
        setIsCheckingAdmin(false);
      } else {
        router.push('/login');
      }
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (blockedDayAppointments) {
      const dates = blockedDayAppointments.map(apt => startOfDay(new Date(apt.startTime)));
      setBlockedDates(dates);
    }
  }, [blockedDayAppointments]);

  const handleBlockDays = async (newlySelectedDays: Date[] | undefined) => {
    if (!firestore || !user) return;
    setIsBlockingDays(true);

    const currentBlockedDocs = blockedDayAppointments || [];
    const newDays = newlySelectedDays || [];

    const batch = writeBatch(firestore);
    
    // Dates to unblock: find which of the currently blocked docs are NOT in the new selection
    currentBlockedDocs.forEach(blockedDoc => {
      const docDate = startOfDay(new Date(blockedDoc.startTime));
      const isStillSelected = newDays.some(selectedDay => isEqual(docDate, startOfDay(selectedDay)));
      if (!isStillSelected) {
        const docRef = doc(firestore, 'appointments', blockedDoc.id);
        batch.delete(docRef);
      }
    });

    // Dates to block: find which of the new selections are NOT in the currently blocked docs
    newDays.forEach(selectedDay => {
      const dayAsDate = startOfDay(selectedDay);
      const isAlreadyBlocked = currentBlockedDocs.some(doc => isEqual(startOfDay(new Date(doc.startTime)), dayAsDate));
      if (!isAlreadyBlocked) {
        const newDocRef = doc(collection(firestore, 'appointments'));
        batch.set(newDocRef, {
          userId: user.uid,
          blocked: true,
          clientName: "DIA BLOQUEADO",
          petName: "N/A",
          startTime: dayAsDate.toISOString(),
          endTime: dayAsDate.toISOString(),
          bathType: "BLOQUEIO",
          totalPrice: 0,
        });
      }
    });

    try {
      await batch.commit();
      toast({ title: 'Sucesso!', description: 'Os dias bloqueados foram atualizados.' });
      refetchBlockedDays();
    } catch (e: any) {
      console.error("Error blocking/unblocking days: ", e);
      toast({ variant: 'destructive', title: 'Erro', description: `Não foi possível atualizar os dias bloqueados. Detalhes: ${e.message}` });
    } finally {
      setIsBlockingDays(false);
    }
};

 const handleUnblockSingleDay = async (dateToUnblock: Date) => {
    if (!firestore) return;
    const docToUnblock = blockedDayAppointments?.find(apt => 
        isEqual(startOfDay(new Date(apt.startTime)), startOfDay(dateToUnblock))
    );

    if (docToUnblock) {
        try {
            await deleteDoc(doc(firestore, 'appointments', docToUnblock.id));
            toast({ title: 'Sucesso!', description: 'O dia foi desbloqueado.' });
        } catch (e: any) {
            console.error("Error unblocking day: ", e);
            toast({ variant: 'destructive', title: 'Erro', description: `Não foi possível desbloquear o dia.` });
        }
    }
  };

  const handleBlockSpecificTime = async () => {
    if (!selectedSpecificDate || !selectedSpecificTime || !firestore || !user) return;
    setIsBlockingTime(true);

    try {
      const [hours, minutes] = selectedSpecificTime.split(':').map(Number);
      const startDateTime = new Date(selectedSpecificDate);
      startDateTime.setHours(hours, minutes, 0, 0);
      const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);

      const newAppointment = {
        userId: user.uid,
        clientName: "HORÁRIO BLOQUEADO",
        petName: "N/A",
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        bathType: "BLOQUEIO_HORARIO",
        blocked: true,
        totalPrice: 0,
      };

      await addDoc(collection(firestore, 'appointments'), newAppointment);

      toast({ title: 'Sucesso!', description: 'Horário específico bloqueado.' });
      setSelectedSpecificDate(undefined);
      setSelectedSpecificTime('');
    } catch (e: any) {
      console.error("Error blocking specific time: ", e);
      toast({ variant: 'destructive', title: 'Erro', description: `Não foi possível bloquear o horário.` });
    } finally {
      setIsBlockingTime(false);
    }
  };

  const handleUnblockSpecificTime = async (docId: string) => {
      if (!firestore) return;
      try {
          await deleteDoc(doc(firestore, 'appointments', docId));
          toast({ title: 'Sucesso!', description: 'O horário foi desbloqueado.' });
      } catch (e: any) {
          console.error("Error unblocking time: ", e);
          toast({ variant: 'destructive', title: 'Erro', description: `Não foi possível desbloquear o horário.` });
      }
  };

  const handleBlockRecurringTime = async (data: RecurringBlockValues) => {
    if (!firestore || !user ) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Usuário não autenticado.',
      });
      return;
    }
    setIsBlocking(true);

    try {
      const dataToSave: Partial<RecurringBlockValues> = { ...data };
      
      if(data.cycleStartDate) {
        dataToSave.startWeekParity = getWeek(data.cycleStartDate, { weekStartsOn: 1 }) % 2;
      }
      
      if (data.startBathNumber) {
          dataToSave.startBathNumber = Number(data.startBathNumber);
      } else {
          delete dataToSave.startBathNumber;
      }

      if (data.frequency !== 'weekly' && data.frequency !== 'monthly') {
        delete dataToSave.startBathNumber;
      }


      await addDoc(collection(firestore, 'recurringBlocks'), dataToSave);

      toast({
        title: 'Sucesso!',
        description: `O horário do clubinho foi salvo.`,
      });
      form.reset({
          dayOfWeek: '',
          time: '',
          petName: '',
          label: 'Clubinho',
          frequency: 'weekly',
          cycleStartDate: new Date(),
          startBathNumber: 1,
      });
      refetchRecurring(); 
    } catch (e) {
      console.error('Error creating recurring block: ', e);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível salvar o bloqueio recorrente.',
      });
    } finally {
      setIsBlocking(false);
    }
  };


  const handleCancelAppointment = async (appointmentId: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'appointments', appointmentId));
      toast({
        title: 'Sucesso!',
        description: 'O agendamento foi cancelado.',
      });
    } catch (e: any) {
      console.error('Error canceling appointment: ', e);
      toast({
        variant: "destructive",
        title: "Erro ao Cancelar",
        description: `Não foi possível cancelar o agendamento. Verifique as permissões de segurança. Detalhes: ${e.message}`,
      });
    }
  };
  
  const handleRemoveRecurringBlock = async (blockId: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'recurringBlocks', blockId));
      toast({
        title: 'Sucesso!',
        description: 'O bloqueio recorrente foi removido.',
      });
      refetchRecurring();
    } catch (e) {
      console.error('Error removing recurring block: ', e);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível remover o bloqueio.',
      });
    }
  };

  const handleRemoveAllRecurringBlocks = async () => {
    if (!firestore || !recurringBlocks || recurringBlocks.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Nenhum item para remover',
        description: 'Não há horários de clubinho para serem removidos.',
      });
      return;
    }

    const batch = writeBatch(firestore);
    recurringBlocks.forEach(block => {
      const docRef = doc(firestore, 'recurringBlocks', block.id);
      batch.delete(docRef);
    });

    try {
      await batch.commit();
      toast({
        title: 'Sucesso!',
        description: 'Todos os horários do clubinho foram removidos.',
      });
      refetchRecurring();
    } catch (e) {
      console.error('Error removing all recurring blocks: ', e);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível remover todos os horários do clubinho.',
      });
    }
  };


  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };
  
  const handleImportSuccess = () => {
    refetchRecurring();
  };
  const handleClearSuccess = () => {
    refetchRecurring();
  };

  if (isUserLoading || isCheckingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Carregando...
      </div>
    );
  }

  if (!user) {
    return null; // Redirect is handled by useEffect
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4 text-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>
            Você não tem permissão para acessar esta página.
          </AlertDescription>
        </Alert>
        <Button onClick={handleLogout} variant="outline">
          <LogOut className="mr-2" />
          Fazer Logout
        </Button>
      </div>
    );
  }

  const isLoading = isLoadingAppointments || isLoadingRecurring || isLoadingBlockedDays || isLoadingDailyVisits || isLoadingBlockedTimes;

  return (
      <div className="container mx-auto p-4 md:p-8 space-y-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className='space-y-1'>
               <CardTitle>Painel Principal</CardTitle>
               <CardDescription>
                Gerencie os agendamentos e horários do seu Pet Shop.
              </CardDescription>
            </div>
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Eye className="h-5 w-5" />
                    <div>
                        <p className="text-xs">Visitas hoje</p>
                        <p className="text-lg font-bold text-foreground">
                            {isLoadingDailyVisits ? '...' : dailyVisitsData?.count ?? 0}
                        </p>
                    </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Button asChild variant="outline">
                      <Link href="/admin/agenda">
                        <CalendarClock className="mr-2" />
                        Ver Agenda
                      </Link>
                  </Button>
                  <Button onClick={handleLogout} variant="outline" size="sm">
                    <LogOut className="mr-2" />
                    Logout
                  </Button>
                </div>
            </div>
          </CardHeader>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <Lock className="h-5 w-5" />
                        Bloquear/Desbloquear Dias
                    </CardTitle>
                    <CardDescription>
                        Clique em uma data no calendário para bloquear ou desbloquear o dia inteiro.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    {isLoading ? (
                        <p>Carregando calendário...</p>
                    ) : (
                        <Calendar
                            mode="multiple"
                            selected={blockedDates}
                            onSelect={handleBlockDays}
                            disabled={isBlockingDays}
                            locale={ptBR}
                            footer={isBlockingDays ? <p className='text-center text-sm mt-2'>Atualizando...</p> : null}
                        />
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <CalendarCheck2 className="h-5 w-5" />
                        Dias Atualmente Bloqueados
                    </CardTitle>
                    <CardDescription>
                        Lista de todos os dias bloqueados. Clique no ícone para remover o bloqueio.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                    {isLoading ? (
                        <p>Carregando dias bloqueados...</p>
                    ) : blockedDates.length > 0 ? (
                        blockedDates
                            .sort((a, b) => a.getTime() - b.getTime())
                            .map((date) => (
                                <div key={date.toISOString()} className="flex items-center justify-between rounded-md border p-3">
                                    <span className="font-medium">{format(date, 'PPP', { locale: ptBR })}</span>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta ação desbloqueará o dia {format(date, 'dd/MM/yyyy')} e ele ficará disponível para novos agendamentos.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Voltar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleUnblockSingleDay(date)}>
                                                    Sim, desbloquear
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            ))
                    ) : (
                        <p className="text-muted-foreground text-sm">Nenhum dia bloqueado no momento.</p>
                    )}
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <Clock className="h-5 w-5" />
                        Bloquear Horário Específico
                    </CardTitle>
                    <CardDescription>
                        Selecione uma data e horário específicos para bloqueá-los de vez na agenda.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium leading-none">Data</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !selectedSpecificDate && "text-muted-foreground"
                                    )}
                                >
                                    {selectedSpecificDate ? (
                                        format(selectedSpecificDate, "PPP", { locale: ptBR })
                                    ) : (
                                        <span>Escolha uma data</span>
                                    )}
                                    <CalendarCheck2 className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    locale={ptBR}
                                    mode="single"
                                    selected={selectedSpecificDate}
                                    onSelect={setSelectedSpecificDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium leading-none">Horário</label>
                        <Select value={selectedSpecificTime} onValueChange={setSelectedSpecificTime}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um horário" />
                            </SelectTrigger>
                            <SelectContent>
                                {generateTimeSlots().map((time) => (
                                    <SelectItem key={time} value={time}>
                                        {time}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button 
                        onClick={handleBlockSpecificTime} 
                        disabled={!selectedSpecificDate || !selectedSpecificTime || isBlockingTime}
                        className="w-full"
                    >
                        {isBlockingTime ? 'Bloqueando...' : 'Bloquear Horário'}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <Clock className="h-5 w-5" />
                        Horários Bloqueados
                    </CardTitle>
                    <CardDescription>
                        Lista de horários específicos bloqueados na agenda. Clique no ícone de lixeira para remover o bloqueio.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                    {isLoadingBlockedTimes ? (
                        <p>Carregando horários bloqueados...</p>
                    ) : blockedTimeAppointments && blockedTimeAppointments.length > 0 ? (
                        blockedTimeAppointments
                            .slice()
                            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                            .map((apt) => (
                                <div key={apt.id} className="flex items-center justify-between rounded-md border p-3">
                                    <span className="font-medium">
                                        {format(new Date(apt.startTime), "PP 'às' HH:mm", { locale: ptBR })}
                                    </span>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Esta ação desbloqueará o horário {format(new Date(apt.startTime), "dd/MM/yyyy 'às' HH:mm")}.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Voltar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleUnblockSpecificTime(apt.id)}>
                                                    Sim, desbloquear
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            ))
                    ) : (
                        <p className="text-muted-foreground text-sm">Nenhum horário específico bloqueado.</p>
                    )}
                </CardContent>
            </Card>
        </div>


        <Card>
          <CardHeader>
            <CardTitle>Criar Horário Fixo de Clubinho</CardTitle>
            <CardDescription>
              Selecione dia, horário, pet e frequência para bloquear na agenda.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleBlockRecurringTime)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <FormField
                      control={form.control}
                      name="dayOfWeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dia da Semana</FormLabel>
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um dia" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">Segunda-feira</SelectItem>
                              <SelectItem value="2">Terça-feira</SelectItem>
                              <SelectItem value="3">Quarta-feira</SelectItem>
                              <SelectItem value="4">Quinta-feira</SelectItem>
                              <SelectItem value="5">Sexta-feira</SelectItem>
                              <SelectItem value="6">Sábado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horário</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um horário" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {generateTimeSlots().map((time) => (
                                <SelectItem
                                  key={time}
                                  value={time}
                                >
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                                    <Input placeholder="Nome do pet" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                      control={form.control}
                      name="frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frequência</FormLabel>
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a frequência" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="weekly">Semanal</SelectItem>
                              <SelectItem value="bi-weekly">Quinzenal</SelectItem>
                              <SelectItem value="monthly">Mensal</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                        control={form.control}
                        name="cycleStartDate"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Data de Início do Ciclo</FormLabel>
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
                                    <CalendarCheck2 className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    locale={ptBR}
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    {(watchedFrequency === 'weekly' || watchedFrequency === 'monthly') && (
                      <FormField
                          control={form.control}
                          name="startBathNumber"
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Nº do Banho Inicial</FormLabel>
                                  <FormControl>
                                      <Input type="number" placeholder="Ex: 1" {...field} value={field.value || ''} onChange={event => field.onChange(event.target.value === '' ? undefined : +event.target.value)} />
                                  </FormControl>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                    )}
                </div>
                <Button type="submit" disabled={isBlocking}>
                  <Repeat className='mr-2' />
                  {isBlocking ? 'Salvando...' : 'Salvar Bloqueio Recorrente'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <BulkImporter
          collectionPath="recurringBlocks"
          onImportSuccess={handleImportSuccess}
          onClearSuccess={handleClearSuccess}
          currentBlocks={recurringBlocks || []}
        />
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Horários Fixos (Clubinho)</CardTitle>
                <CardDescription>
                  Horários bloqueados recorrentemente na agenda.
                </CardDescription>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={!recurringBlocks || recurringBlocks.length === 0}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remover Todos
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Isso removerá permanentemente
                      todos os horários fixos do clubinho.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRemoveAllRecurringBlocks}>
                      Sim, remover tudo
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingRecurring && <p>Carregando horários fixos...</p>}
            {recurringError && <p className="text-red-500">{recurringError.message}</p>}
            {!isLoadingRecurring && !recurringBlocks?.length && (
              <p>Nenhum horário fixo de clubinho encontrado.</p>
            )}
            {recurringBlocks && recurringBlocks.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dia da Semana</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Pet</TableHead>
                    <TableHead>Frequência</TableHead>
                    <TableHead>Início do Ciclo</TableHead>
                    <TableHead>Banho Inicial</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recurringBlocks
                    .sort((a, b) => parseInt(a.dayOfWeek) - parseInt(b.dayOfWeek) || a.time.localeCompare(b.time))
                    .map((block) => (
                      <TableRow key={block.id}>
                        <TableCell className='font-medium'>
                          {getDayOfWeekName(parseInt(block.dayOfWeek, 10))}
                        </TableCell>
                        <TableCell>
                          {block.time}
                        </TableCell>
                        <TableCell>
                          {block.petName}
                        </TableCell>
                         <TableCell>
                          <Badge variant={block.frequency === 'weekly' ? 'default' : block.frequency === 'monthly' ? 'secondary' : 'outline'}>
                            {block.frequency === 'weekly' ? 'Semanal' : block.frequency === 'bi-weekly' ? 'Quinzenal' : 'Mensal'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {block.cycleStartDate ? format(new Date(block.cycleStartDate.seconds * 1000), 'dd/MM/yy') : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {(block.frequency === 'weekly' || block.frequency === 'monthly') ? block.startBathNumber || 'N/A' : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className='text-destructive hover:text-destructive'>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remover
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação removerá o bloqueio recorrente do clubinho para {block.petName}.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Voltar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRemoveRecurringBlock(block.id)}>
                                  Sim, remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Painel de Administração de Agendamentos</CardTitle>
            <CardDescription>
              Agendamentos feitos pelos clientes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAppointments && <p>Carregando agendamentos...</p>}
            {error && <p className="text-red-500">{error.message}</p>}
            {!isLoadingAppointments && !appointments?.length && (
              <p>Nenhum agendamento encontrado.</p>
            )}
            {appointments && appointments.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Pet</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments
                    .filter(apt => !apt.blocked) // Filtra para não mostrar horários bloqueados
                    .sort(
                      (a, b) =>
                        new Date(a.startTime).getTime() -
                        new Date(b.startTime).getTime()
                    )
                    .map((apt) => (
                      <TableRow key={apt.id}>
                        <TableCell>{apt.clientName}</TableCell>
                        <TableCell>{apt.petName}</TableCell>
                        <TableCell>{apt.bathType}</TableCell>
                        <TableCell>
                          {format(new Date(apt.startTime), 'dd/MM/yyyy', {
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell>
                          {format(new Date(apt.startTime), 'HH:mm', {
                            locale: ptBR,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                 <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. Isso irá cancelar permanentemente o agendamento de {apt.clientName} para o pet {apt.petName}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Voltar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleCancelAppointment(apt.id)}>
                                    Sim, cancelar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
