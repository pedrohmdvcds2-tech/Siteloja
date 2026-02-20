"use client";

import { useState } from 'react';
import Papa from 'papaparse';
import { useFirebase } from '@/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, AlertCircle, FileText, Trash2 } from 'lucide-react';
import { recurringBlockSchema } from '@/lib/definitions';
import { format, parse, getWeek } from 'date-fns';
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

interface BulkImporterProps {
  collectionPath: string;
  onImportSuccess: () => void;
  onClearSuccess: () => void;
  currentBlocks: any[];
}

const dayOfWeekMap: { [key: string]: string } = {
  'segunda': '1', 'segunda-feira': '1',
  'terca': '2', 'terça-feira': '2',
  'quarta': '3', 'quarta-feira': '3',
  'quinta': '4', 'quinta-feira': '4',
  'sexta': '5', 'sexta-feira': '5',
  'sabado': '6', 'sábado': '6',
};

const frequencyMap: { [key: string]: string } = {
    'semanal': 'weekly',
    'quinzenal': 'bi-weekly',
    'mensal': 'monthly',
};

const parseDateString = (dateStr: string): Date | undefined => {
    if (!dateStr || dateStr.trim() === '') return undefined;
    try {
        return parse(dateStr.trim(), 'dd/MM/yyyy', new Date());
    } catch (e) {
        console.warn(`Data inválida encontrada e ignorada: "${dateStr}"`);
        return undefined;
    }
};

export function BulkImporter({ collectionPath, onImportSuccess, onClearSuccess, currentBlocks }: BulkImporterProps) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Keep all values as strings
      transformHeader: header => header.trim(),
      complete: async (results) => {
        if (!firestore) {
          setError("Conexão com o banco de dados não encontrada.");
          setIsImporting(false);
          return;
        }

        const batch = writeBatch(firestore);
        let validRows = 0;

        for (const row of results.data as any[]) {
            const dayOfWeekRaw = (row.dayOfWeek || '').toLowerCase().trim();
            const frequencyRaw = (row.frequency || '').toLowerCase().trim();
            const timeRaw = (row.time || '').trim();
            const cycleStartDateRaw = (row.cycleStartDate || '').trim();
            const startBathNumberRaw = (row.startBathNumber || '').trim();

            const dayOfWeek = dayOfWeekMap[dayOfWeekRaw];
            const frequency = frequencyMap[frequencyRaw];
            
            if (!dayOfWeek || !frequency || !timeRaw || !row.petName) {
                console.warn(`Linha com campos obrigatórios ausentes, pulando:`, row);
                continue;
            }

            const dataToValidate: any = {
              dayOfWeek,
              time: timeRaw,
              petName: row.petName,
              frequency,
              label: 'Clubinho'
            };

            const cycleStartDate = parseDateString(cycleStartDateRaw);
            if(cycleStartDate) {
                dataToValidate.cycleStartDate = cycleStartDate;
                dataToValidate.startWeekParity = getWeek(cycleStartDate, { weekStartsOn: 1 }) % 2;
            }
            
            if (frequency === 'weekly') {
                const startBathNumber = startBathNumberRaw ? parseInt(startBathNumberRaw, 10) : undefined;
                if (startBathNumber && !isNaN(startBathNumber)) {
                    dataToValidate.startBathNumber = startBathNumber;
                }
            }

            const validation = recurringBlockSchema.safeParse(dataToValidate);

            if (validation.success) {
              const docRef = doc(collection(firestore, collectionPath));
              batch.set(docRef, validation.data);
              validRows++;
            } else {
              console.warn("Linha inválida, pulando:", { rowData: row, error: validation.error.flatten().fieldErrors });
            }
        }
        
        if (validRows > 0) {
            try {
                await batch.commit();
                toast({
                    title: 'Importação Concluída!',
                    description: `${validRows} horários do clubinho foram adicionados/atualizados.`,
                });
                onImportSuccess();
            } catch (e: any) {
                console.error("Erro durante a importação em massa: ", e);
                setError(`Falha ao salvar os dados. Verifique o console para mais detalhes. Erro: ${e.message}`);
            } finally {
                setIsImporting(false);
            }
        } else {
            setError("Nenhuma linha válida encontrada no arquivo CSV. Verifique o formato e os dados do arquivo e tente novamente.");
            setIsImporting(false);
        }
        event.target.value = ''; // Reset input
      },
      error: (err: any) => {
        setError(`Falha ao ler o arquivo CSV: ${err.message}`);
        setIsImporting(false);
      },
    });
  };
  
  const handleClearAll = async () => {
    if (!firestore || !currentBlocks || currentBlocks.length === 0) {
      toast({ variant: 'destructive', title: 'Nenhum item para remover.' });
      return;
    }
    setIsClearing(true);
    const batch = writeBatch(firestore);
    currentBlocks.forEach(block => {
      const docRef = doc(firestore, collectionPath, block.id);
      batch.delete(docRef);
    });

    try {
      await batch.commit();
      toast({ title: 'Sucesso!', description: 'Todos os horários de clubinho foram removidos.' });
      onClearSuccess();
    } catch (e: any) {
      console.error("Erro ao limpar todos os blocos: ", e);
      setError(`Falha ao remover os horários. Erro: ${e.message}`);
    } finally {
      setIsClearing(false);
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Clubinhos em Massa
        </CardTitle>
        <CardDescription>
          Faça o upload de um arquivo CSV para adicionar múltiplos horários de clubinho de uma só vez.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
            <label htmlFor="csv-importer" className="flex-grow">
              <Input
                  id="csv-importer"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={isImporting || isClearing}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              />
            </label>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isImporting || isClearing || !currentBlocks || currentBlocks.length === 0}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Limpar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação removerá permanentemente TODOS os horários de clubinho existentes antes de uma nova importação.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAll} disabled={isClearing}>
                    {isClearing ? 'Limpando...' : 'Sim, limpar tudo'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
        
        {isImporting && (
             <div className="flex items-center gap-2 text-primary">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                Processando arquivo...
            </div>
        )}

        {error && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro na Importação</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        <Alert variant="default" className='bg-accent/50'>
            <FileText className="h-4 w-4" />
            <AlertTitle>Instruções para o Arquivo CSV</AlertTitle>
            <AlertDescription>
                <p className='mb-2'>O arquivo deve ter as colunas: <strong>dayOfWeek, time, petName, frequency</strong>. Colunas opcionais: <strong>cycleStartDate, startBathNumber</strong>.</p>
                <ul className="list-disc list-inside text-xs space-y-1">
                    <li><strong>dayOfWeek:</strong> 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'.</li>
                    <li><strong>time:</strong> Formato HH:mm (ex: 14:00).</li>
                    <li><strong>petName:</strong> O nome do pet.</li>
                    <li><strong>frequency:</strong> 'semanal', 'quinzenal', ou 'mensal'.</li>
                    <li><strong>cycleStartDate (opcional):</strong> Data de início do ciclo no formato dd/MM/yyyy.</li>
                    <li><strong>startBathNumber (opcional, para 'semanal'):</strong> Número do banho inicial (ex: 1, 2, 3, 4).</li>
                </ul>
            </AlertDescription>
        </Alert>

      </CardContent>
    </Card>
  );
}
