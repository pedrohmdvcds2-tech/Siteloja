'use client';
import { useUser, useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  collection,
  doc,
  deleteDoc,
  query,
  addDoc,
  where,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, toDate } from 'date-fns';
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
import { LogOut, Calendar as CalendarIcon, Trash2, Unlock, CalendarPlus, CalendarClock, Repeat, Dog } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
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


export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const { firestore, auth } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isBlocking, setIsBlocking] = useState(false);

  const ADMIN_EMAILS = ['admin@princesaspetshop.com'];

  const form = useForm<RecurringBlockValues>({
    resolver: zodResolver(recurringBlockSchema),
    defaultValues: {
      dayOfWeek: '',
      time: '',
      petName: '',
      label: 'Clubinho',
      frequency: 'weekly',
      startDate: new Date(),
    },
  });

  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(
      collection(firestore, 'appointments'),
      where('blocked', '==', false)
    );
  }, [firestore, isAdmin]);

  const recurringBlocksQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return collection(firestore, 'recurringBlocks');
  }, [firestore, isAdmin]);

  const {
    data: appointments,
    isLoading: isLoadingAppointments,
    error,
  } = useCollection(appointmentsQuery);

  const {
    data: recurringBlocks,
    isLoading: isLoadingRecurring,
    error: recurringError,
    refetch: refetchRecurring,
  } = useCollection(recurringBlocksQuery);


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
       const newBlock = {
        ...data,
        startDate: data.startDate.toISOString(), // Convert Date to ISO string
      };
      await addDoc(collection(firestore, 'recurringBlocks'), newBlock);

      toast({
        title: 'Sucesso!',
        description: `O horário do clubinho foi salvo e será bloqueado com frequência ${data.frequency === 'weekly' ? 'semanal' : 'quinzenal'}.`,
      });
      form.reset();
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

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
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
          </CardHeader>
        </Card>
      
        <Card>
          <CardHeader>
            <CardTitle>Criar Horário Fixo de Clubinho</CardTitle>
            <CardDescription>
              Selecione dia, horário, pet, frequência e data de início para bloquear na agenda.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleBlockRecurringTime)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className='flex flex-col pt-2'>
                          <FormLabel>Data de Início</FormLabel>
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
                                disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                <Button type="submit" disabled={isBlocking}>
                  <Repeat className='mr-2' />
                  {isBlocking ? 'Salvando...' : 'Salvar Bloqueio Recorrente'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Horários Fixos (Clubinho)</CardTitle>
            <CardDescription>
              Horários bloqueados recorrentemente na agenda.
            </CardDescription>
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
                    <TableHead>Início</TableHead>
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
                          <Badge variant={block.frequency === 'weekly' ? 'secondary' : 'outline'}>
                            {block.frequency === 'weekly' ? 'Semanal' : 'Quinzenal'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {block.startDate ? format(toDate(block.startDate), 'dd/MM/yyyy') : 'N/A'}
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
