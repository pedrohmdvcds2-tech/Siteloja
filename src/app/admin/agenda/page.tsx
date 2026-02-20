'use client';
import { useState, useMemo, useEffect } from 'react';
import { useUser, useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where } from 'firebase/firestore';
import { format, getWeek, startOfDay as startOfDayFns, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Dog, Calendar as CalendarIcon } from 'lucide-react';

interface UnifiedAppointment {
    id: string;
    startTime: string;
    type: 'client' | 'recurring';
    clientName?: string;
    petName: string;
    service?: string;
    label?: string;
    bathCount?: number;
}

export default function AgendaPage() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const ADMIN_EMAILS = ['admin@princesaspetshop.com.br'];

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
    if (!selectedDate || !recurringBlocks) return [];

    const schedule: UnifiedAppointment[] = [];

    // 1. Add client appointments
    if (dayAppointments) {
        dayAppointments.forEach(apt => {
            if(apt.blocked) {
                return;
            }
            schedule.push({
                id: apt.id,
                startTime: apt.startTime,
                type: 'client',
                clientName: apt.clientName,
                petName: apt.petName,
                service: apt.bathType,
            });
        });
    }

    // 2. Add recurring blocks (clubinho)
    const selectedDayOfWeek = selectedDate.getDay();
    const startOfSelectedDate = startOfDayFns(selectedDate);

    recurringBlocks.forEach(block => {
        const blockDayOfWeek = parseInt(block.dayOfWeek, 10);
        if (blockDayOfWeek !== selectedDayOfWeek) return;

        const cycleStartDate = block.cycleStartDate ? startOfDayFns(new Date(block.cycleStartDate.seconds * 1000)) : startOfDayFns(new Date());
        
        if (isBefore(startOfSelectedDate, cycleStartDate)) {
            return;
        }

        const diffInMs = startOfSelectedDate.getTime() - cycleStartDate.getTime();
        const diffInWeeks = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 7));

        let isValidForFrequency = false;
        if (block.frequency === 'weekly' || block.frequency === 'monthly') {
            isValidForFrequency = true;
        } else if (block.frequency === 'bi-weekly') {
             if (diffInWeeks % 2 === 0) {
                isValidForFrequency = true;
            }
        }
        
        if (!isValidForFrequency) {
            return;
        }

        let bathCount: number | undefined = undefined;
        const startBathNumber = block.startBathNumber || 1;

        if (block.frequency === 'weekly') {
            if (diffInWeeks >= 0) {
                const totalOccurrences = diffInWeeks + 1;
                bathCount = (((startBathNumber - 1) + (totalOccurrences - 1)) % 4) + 1;
            }
        } else if (block.frequency === 'monthly') {
            const selectedYear = selectedDate.getFullYear();
            const selectedMonth = selectedDate.getMonth();
            const cycleStartYear = cycleStartDate.getFullYear();
            const cycleStartMonth = cycleStartDate.getMonth();

            if (selectedYear === cycleStartYear && selectedMonth === cycleStartMonth) {
                const weeksSinceCycleStart = Math.floor(
                    (startOfSelectedDate.getTime() - cycleStartDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
                );

                if (weeksSinceCycleStart >= 0) {
                    bathCount = startBathNumber + weeksSinceCycleStart;
                }
            } else {
                const dayOfWeek = selectedDayOfWeek;
                let firstOccurrenceDate = new Date(selectedYear, selectedMonth, 1);
                while (firstOccurrenceDate.getDay() !== dayOfWeek) {
                    firstOccurrenceDate.setDate(firstOccurrenceDate.getDate() + 1);
                }
                firstOccurrenceDate = startOfDayFns(firstOccurrenceDate);
                
                const weeksPassedInMonth = Math.floor(
                    (startOfSelectedDate.getTime() - firstOccurrenceDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
                );
                
                if (weeksPassedInMonth >= 0) {
                    bathCount = weeksPassedInMonth + 1;
                }
            }
        }

        const [hours, minutes] = block.time.split(':').map(Number);
        const startTime = new Date(selectedDate);
        startTime.setHours(hours, minutes, 0, 0);

        schedule.push({
            id: `${block.id}-${block.petName}-${selectedDate.toISOString()}`,
            startTime: startTime.toISOString(),
            type: 'recurring',
            petName: block.petName,
            label: block.label,
            bathCount: bathCount
        });
    });

    // 3. Sort the final schedule
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
      <header className='flex items-center justify-between'>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <Button asChild variant="outline">
              <Link href="/admin">
                  <ArrowLeft className="mr-2" />
                  Voltar ao Painel
              </Link>
          </Button>
      </header>
      
      <div className="flex flex-col gap-8">
        {/* Calendar section */}
        <div className="w-full">
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center justify-center gap-2'>
                <CalendarIcon className='h-5 w-5' />
                Selecione uma Data
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center p-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="p-0"
                locale={ptBR}
              />
            </CardContent>
          </Card>
        </div>

        {/* Schedule section */}
        <div className="w-full">
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
                <div className="overflow-x-auto">
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
                                    <div className='text-sm text-muted-foreground'>{item.petName}</div>
                                    <div className='text-xs text-muted-foreground mt-1'>{item.service}</div>
                                </>
                            ) : (
                                <div className="flex flex-col gap-1">
                                <div className='font-medium flex items-center gap-2'>
                                    <Dog className="h-4 w-4 text-primary" /> 
                                    <span>{item.petName}</span>
                                </div>
                                <div className='flex items-center gap-2'>
                                    {item.bathCount && item.bathCount > 0 && (
                                        <Badge variant="outline">{item.bathCount}º Banho</Badge>
                                    )}
                                </div>
                                </div>
                            )}
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
