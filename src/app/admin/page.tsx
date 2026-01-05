'use client';
import { useUser, useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, doc, updateDoc, query } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';

export default function AdminPage() {
  const { user, isUserLoading } = useUser();
  const { firestore, auth } = useFirebase();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  // Simplified admin check: checks for a specific email.
  const ADMIN_EMAIL = "admin@petshop.com";

  const appointmentsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return query(collection(firestore, 'appointments'));
  }, [firestore, isAdmin]);

  const {
    data: appointments,
    isLoading: isLoadingAppointments,
    error,
  } = useCollection(appointmentsQuery);

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        // Check if the logged-in user's email is the admin email
        setIsAdmin(user.email === ADMIN_EMAIL);
        setIsCheckingAdmin(false);
      } else {
        // If no user, redirect to login
        router.push('/login');
      }
    }
  }, [user, isUserLoading, router]);


  const handleBlockToggle = async (appointmentId: string, blocked: boolean) => {
    if (!firestore) return;
    const appointmentRef = doc(firestore, 'appointments', appointmentId);
    try {
      await updateDoc(appointmentRef, { blocked: !blocked });
    } catch (e) {
      console.error('Error updating document: ', e);
    }
  };

  const handleLogout = async () => {
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
    <div className="container mx-auto p-4 md:p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Painel de Administração de Agendamentos</CardTitle>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="mr-2" />
            Logout
          </Button>
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
                  <TableHead>Data</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Pet</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ação</TableHead>
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
                      <TableCell>{apt.clientName}</TableCell>
                      <TableCell>{apt.petName}</TableCell>
                      <TableCell>{apt.bathType}</TableCell>
                      <TableCell>
                        <Badge
                          variant={apt.blocked ? 'destructive' : 'secondary'}
                        >
                          {apt.blocked ? 'Bloqueado' : 'Aberto'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={apt.blocked ? 'secondary' : 'destructive'}
                          onClick={() => handleBlockToggle(apt.id, apt.blocked)}
                        >
                          {apt.blocked ? 'Desbloquear' : 'Bloquear'}
                        </Button>
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