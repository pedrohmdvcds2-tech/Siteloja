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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LogOut, Calendar as CalendarIcon, Trash2, Unlock, CalendarPlus, CalendarClock } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn, generateTimeSlots } from '@/lib/utils';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const { firestore, auth } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  // State for the new blocking form
  const [blockDate, setBlockDate] = useState<Date | undefined>();
  const [timeSlotsToBlock, setTimeSlotsToBlock] = useState<string[]>([]);
  const [isBlocking, setIsBlocking] = useState(false);

  const ADMIN_EMAILS = ['admin@princesaspetshop.com'];

  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(
      collection(firestore, 'appointments'),
      where('blocked', '==', false)
    );
  }, [firestore, isAdmin]);

  const blockedAppointmentsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(
      collection(firestore, 'appointments'),
      where('blocked', '==', true)
    );
  }, [firestore, isAdmin]);

  const {
    data: appointments,
    isLoading: isLoadingAppointments,
    error,
    refetch,
  } = useCollection(appointmentsQuery);

  const {
    data: blockedAppointments,
    isLoading: isLoadingBlocked,
    error: blockedError,
    refetch: refetchBlocked,
  } = useCollection(blockedAppointmentsQuery);

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

  const handleBlockTimes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user || !blockDate || timeSlotsToBlock.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Por favor, selecione uma data e pelo menos um horário.',
      });
      return;
    }
    setIsBlocking(true);

    try {
      const batch = writeBatch(firestore);

      for (const timeSlot of timeSlotsToBlock) {
        const [hours, minutes] = timeSlot.split(':').map(Number);
        const startTime = new Date(blockDate);
        startTime.setHours(hours, minutes, 0, 0);

        const newBlockedAppointment = {
          userId: user.uid,
          clientName: 'Horário Bloqueado',
          petName: 'Admin',
          startTime: startTime.toISOString(),
          endTime: new Date(startTime.getTime() + 30 * 60000).toISOString(),
          bathType: 'N/A',
          totalPrice: 0,
          blocked: true,
          vaccinationCardUrl: '',
        };
        
        const docRef = doc(collection(firestore, 'appointments'));
        batch.set(docRef, newBlockedAppointment);
      }

      await batch.commit();

      toast({
        title: 'Sucesso!',
        description: 'Os horários foram bloqueados.',
      });
      setBlockDate(undefined);
      setTimeSlotsToBlock([]);
      refetchBlocked(); 
    } catch (e) {
      console.error('Error blocking time slots: ', e);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível bloquear os horários.',
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
      // refetch() is handled by useCollection's real-time listener
    } catch (e: any) {
      console.error('Error canceling appointment: ', e);
      toast({
        variant: "destructive",
        title: "Erro ao Cancelar",
        description: `Não foi possível cancelar o agendamento. Verifique as permissões de segurança. Detalhes: ${e.message}`,
      });
    }
  };
  
  const handleUnblockAppointment = async (appointmentId: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'appointments', appointmentId));
      toast({
        title: 'Sucesso!',
        description: 'O horário foi desbloqueado.',
      });
      refetchBlocked();
    } catch (e) {
      console.error('Error unblocking appointment: ', e);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível desbloquear o horário.',
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
    <TooltipProvider>
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
            <CardTitle>Bloquear Horários</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBlockTimes} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'pl-3 text-left font-normal',
                          !blockDate && 'text-muted-foreground'
                        )}
                      >
                        {blockDate ? (
                          format(blockDate, 'PPP', { locale: ptBR })
                        ) : (
                          <span>Escolha uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        locale={ptBR}
                        mode="single"
                        selected={blockDate}
                        onSelect={setBlockDate}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                          date.getDay() === 0
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Horários para bloquear</Label>
                  <Select
                    value={undefined} // Not a controlled component for selection
                    onValueChange={(value) => {
                      if (value && !timeSlotsToBlock.includes(value)) {
                        setTimeSlotsToBlock((prev) => [...prev, value].sort());
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Adicionar um horário para bloquear" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateTimeSlots().map((time) => (
                        <SelectItem
                          key={time}
                          value={time}
                          disabled={timeSlotsToBlock.includes(time)}
                        >
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {timeSlotsToBlock.length > 0 && (
                <div className="space-y-2">
                  <Label>Horários selecionados:</Label>
                  <div className="flex flex-wrap gap-2">
                    {timeSlotsToBlock.map((time) => (
                      <Badge
                        key={time}
                        variant="secondary"
                        className="flex items-center gap-2"
                      >
                        {time}
                        <button
                          type="button"
                          className="rounded-full hover:bg-muted"
                          onClick={() =>
                            setTimeSlotsToBlock(
                              timeSlotsToBlock.filter((t) => t !== time)
                            )
                          }
                        >
                          &#x2715;
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <Button type="submit" disabled={isBlocking}>
                {isBlocking ? 'Bloqueando...' : 'Bloquear Horários Selecionados'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Horários Bloqueados</CardTitle>
            <CardDescription>
              Horários que você bloqueou manually. Clique para desbloquear.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingBlocked && <p>Carregando horários bloqueados...</p>}
            {blockedError && <p className="text-red-500">{blockedError.message}</p>}
            {!isLoadingBlocked && !blockedAppointments?.length && (
              <p>Nenhum horário bloqueado encontrado.</p>
            )}
            {blockedAppointments && blockedAppointments.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blockedAppointments
                    .sort(
                      (a, b) =>
                        new Date(a.startTime).getTime() -
                        new Date(b.startTime).getTime()
                    )
                    .map((apt) => (
                      <TableRow key={apt.id}>
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
                              <Button variant="ghost" size="sm">
                                <Unlock className="mr-2 h-4 w-4" />
                                Desbloquear
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação liberará este horário na agenda para novos agendamentos.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Voltar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleUnblockAppointment(apt.id)}>
                                  Sim, desbloquear
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
    </TooltipProvider>
  );
}

    