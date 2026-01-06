'use client';
import { useState, useMemo, useEffect } from 'react';
import { useUser, useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, query } from 'firebase/firestore';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';

export default function AgendaPage() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const ADMIN_EMAILS = ['admin@princesaspetshop.com'];

  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, 'appointments'));
  }, [firestore, isAdmin]);

  const { data: allAppointments, isLoading: isLoadingAppointments, error } = useCollection(appointmentsQuery);

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

  const appointmentsByDay = useMemo(() => {
    if (!allAppointments) return {};
    return allAppointments.reduce((acc, apt) => {
      const date = format(new Date(apt.startTime), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(apt);
      return acc;
    }, {} as Record<string, typeof allAppointments>);
  }, [allAppointments]);

  const highlightedDays = useMemo(() => {
    return Object.keys(appointmentsByDay).map(dateStr => new Date(dateStr + 'T00:00:00'));
  }, [appointmentsByDay]);

  const selectedDayAppointments = useMemo(() => {
    if (!selectedDate || !allAppointments) return [];
    return allAppointments
      .filter(apt => isSameDay(new Date(apt.startTime), selectedDate))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }, [selectedDate, allAppointments]);

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
                        modifiers={{ highlighted: highlightedDays }}
                        modifiersClassNames={{
                            highlighted: 'bg-primary/20 text-primary-foreground rounded-full',
                        }}
                    />
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Agendamentos para {selectedDate ? format(selectedDate, 'PPP', { locale: ptBR }) : '...'}
              </CardTitle>
              <CardDescription>
                Lista de todos os agendamentos e bloqueios para o dia selecionado.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAppointments && <p>Carregando agendamentos...</p>}
              {error && <p className="text-red-500">{error.message}</p>}
              {!isLoadingAppointments && selectedDayAppointments.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <p>Nenhum agendamento para este dia.</p>
                </div>
              )}
              {selectedDayAppointments.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Horário</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Detalhes</TableHead>
                      <TableHead>Serviço</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedDayAppointments.map(apt => (
                      <TableRow key={apt.id}>
                        <TableCell className="font-medium">{format(new Date(apt.startTime), 'HH:mm')}</TableCell>
                        <TableCell>
                          {apt.blocked ? (
                            <Badge variant="destructive">Bloqueado</Badge>
                          ) : (
                            <Badge variant="secondary">Cliente</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className='font-medium'>{apt.clientName}</div>
                          <div className='text-sm text-muted-foreground'>{apt.petName}</div>
                        </TableCell>
                        <TableCell>{apt.bathType}</TableCell>
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

    