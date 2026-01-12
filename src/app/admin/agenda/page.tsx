'use client';
import { useState, useMemo, useEffect } from 'react';
import { useUser, useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users } from 'lucide-react';

interface UnifiedAppointment {
    id: string;
    startTime: string;
    type: 'client' | 'recurring';
    clientName?: string;
    petNames: string[];
    service?: string;
    label?: string;
}

export default function AgendaPage() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const ADMIN_EMAILS = ['admin@princesaspetshop.com'];

  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin || !selectedDate) return null;
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    return query(
        collection(firestore, 'appointments'),
        where('startTime', '>=', startOfDay.toISOString()),
        where('startTime', '<=', endOfDay.toISOString())
    );
  }, [firestore, isAdmin, selectedDate]);

  const recurringBlocksQuery = useMemoFirebase(() => {
      if (!firestore || !isAdmin) return null;
      return collection(firestore, 'recurringBlocks');
  }, [firestore, isAdmin]);

  const { data: dayAppointments, isLoading: isLoadingAppointments, error } = useCollection(appointmentsQuery);
  const { data: recurringBlocks, isLoading: isLoadingRecurring } = useCollection(recurringBlocksQuery);

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
  
  const selectedDaySchedule = useMemo(() => {
    if (!selectedDate) return [];

    const schedule: UnifiedAppointment[] = [];

    // 1. Adicionar agendamentos de clientes
    if (dayAppointments) {
      dayAppointments.forEach(apt => {
        if(apt.blocked) {
            // Ignorar bloqueios manuais antigos se existirem
            return;
        }
        schedule.push({
          id: apt.id,
          startTime: apt.startTime,
          type: 'client',
          clientName: apt.clientName,
          petNames: [apt.petName],
          service: apt.bathType,
        });
      });
    }

    // 2. Adicionar bloqueios recorrentes (clubinho)
    if (recurringBlocks) {
        const dayOfWeek = selectedDate.getDay().toString(); // Domingo = 0, ...
        const dayRecurringBlocks = recurringBlocks.filter(b => b.dayOfWeek === dayOfWeek);

        const recurringGroupedByTime: Record<string, any[]> = {};
        dayRecurringBlocks.forEach(block => {
            if(!recurringGroupedByTime[block.time]) {
                recurringGroupedByTime[block.time] = [];
            }
            recurringGroupedByTime[block.time].push(block);
        });
        
        Object.entries(recurringGroupedByTime).forEach(([time, blocks]) => {
            const [hours, minutes] = time.split(':').map(Number);
            const startTime = new Date(selectedDate);
            startTime.setHours(hours, minutes, 0, 0);

            schedule.push({
                id: `recurring-${time}`,
                startTime: startTime.toISOString(),
                type: 'recurring',
                petNames: blocks.map(b => b.petName),
                label: blocks[0].label, // Assume all have same label
            });
        });
    }

    // 3. Ordenar o cronograma final
    return schedule.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [selectedDate, dayAppointments, recurringBlocks]);


  if (isUserLoading || isCheckingAdmin) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!user) {
    return null; // Redirect is handled by useEffect
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4 text-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>Você não tem permissão para acessar esta página.</AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href="/login">Fazer Login</Link>
        </Button>
      </div>
    );
  }
  
  const isLoading = isLoadingAppointments || isLoadingRecurring;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <div className='flex items-center justify-between'>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <Button asChild variant="outline">
              <Link href="/admin">
                  <ArrowLeft className="mr-2" />
                  Voltar ao Painel
              </Link>
          </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
            <Card>
                <CardContent className="p-2">
                    <Calendar
                        id="admin-agenda-calendar"
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        className="w-full"
                        locale={ptBR}
                    />
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Agenda para {selectedDate ? format(selectedDate, 'PPP', { locale: ptBR }) : '...'}
              </CardTitle>
              <CardDescription>
                Lista de todos os agendamentos e horários de clubinho para o dia selecionado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && <p>Carregando agendamentos...</p>}
              {error && <p className="text-red-500">{error.message}</p>}
              {!isLoading && selectedDaySchedule.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <p>Nenhum agendamento para este dia.</p>
                </div>
              )}
              {selectedDaySchedule.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Horário</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedDaySchedule.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{format(new Date(item.startTime), 'HH:mm')}</TableCell>
                        <TableCell>
                          {item.type === 'recurring' ? (
                            <Badge variant="destructive">{item.label || 'Clubinho'}</Badge>
                          ) : (
                            <Badge variant="secondary">Cliente</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.type === 'client' ? (
                            <>
                                <div className='font-medium'>{item.clientName}</div>
                                <div className='text-sm text-muted-foreground'>{item.petNames[0]}</div>
                                <div className='text-xs text-muted-foreground mt-1'>{item.service}</div>
                            </>
                          ) : (
                            <div className="flex flex-col gap-1">
                               <div className='font-medium flex items-center gap-2'>
                                  <Users className="h-4 w-4 text-primary" /> 
                                  <span>{item.petNames.length} pets no clubinho</span>
                               </div>
                               <div className='text-sm text-muted-foreground'>
                                {item.petNames.join(', ')}
                               </div>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
