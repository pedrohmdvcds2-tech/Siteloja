"use client";

import { useState } from 'react';
import Papa from 'papaparse';
import { useFirebase } from '@/firebase';
import { collection, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload, AlertCircle, FileText } from 'lucide-react';
import { recurringBlockSchema } from '@/lib/definitions';
import { format, parse } from 'date-fns';

interface BulkImporterProps {
  collectionPath: string;
  onImportSuccess: () => void;
}

// Mapeia os dias da semana em português para o índice numérico (Segunda=1)
const dayOfWeekMap: { [key: string]: string } = {
  'segunda': '1',
  'segunda-feira': '1',
  'terca': '2',
  'terça-feira': '2',
  'quarta': '3',
  'quarta-feira': '3',
  'quinta': '4',
  'quinta-feira': '4',
  'sexta': '5',
  'sexta-feira': '5',
  'sabado': '6',
  'sábado': '6',
};

// Mapeia as frequências para os valores do schema
const frequencyMap: { [key: string]: string } = {
    'semanal': 'weekly',
    'quinzenal': 'bi-weekly'
}

export function BulkImporter({ collectionPath, onImportSuccess }: BulkImporterProps) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        if (!firestore) {
          setError("Conexão com o banco de dados não encontrada.");
          setIsImporting(false);
          return;
        }

        try {
          const batch = writeBatch(firestore);
          const requiredHeaders = ['dayOfWeek', 'time', 'petName', 'frequency'];
          const fileHeaders = results.meta.fields || [];
          
          const hasAllHeaders = requiredHeaders.every(h => fileHeaders.includes(h));
          if (!hasAllHeaders) {
            setError(`O arquivo CSV deve conter os seguintes cabeçalhos: ${requiredHeaders.join(', ')}.`);
            setIsImporting(false);
            return;
          }

          for (const row of results.data as any[]) {
            const dayOfWeekRaw = (row.dayOfWeek || '').toLowerCase().trim();
            const frequencyRaw = (row.frequency || '').toLowerCase().trim();
            const timeRaw = (row.time || '').trim();
            
            const dayOfWeek = dayOfWeekMap[dayOfWeekRaw];
            const frequency = frequencyMap[frequencyRaw];
            
            if (!dayOfWeek) {
                console.warn(`Dia da semana inválido ou não mapeado na linha: ${JSON.stringify(row)}`);
                continue; // Pula a linha se o dia da semana for inválido
            }
             if (!frequency) {
                console.warn(`Frequência inválida ou não mapeada na linha: ${JSON.stringify(row)}`);
                continue;
            }

            const dataToValidate = {
              dayOfWeek,
              time: timeRaw,
              petName: row.petName,
              frequency,
              label: 'Clubinho' // Valor padrão
            };
            
            const validation = recurringBlockSchema.safeParse(dataToValidate);

            if (validation.success) {
              const docRef = collection(firestore, collectionPath).doc();
              batch.set(docRef, validation.data);
            } else {
              console.warn("Linha inválida, pulando:", validation.error.flatten().fieldErrors);
            }
          }

          await batch.commit();
          onImportSuccess();
        } catch (e: any) {
          console.error("Erro durante a importação em massa: ", e);
          setError(`Falha ao importar os dados. Verifique o console para mais detalhes. Erro: ${e.message}`);
        } finally {
          setIsImporting(false);
          // Limpa o valor do input para permitir o upload do mesmo arquivo novamente
          event.target.value = '';
        }
      },
      error: (err: any) => {
        setError(`Falha ao ler o arquivo CSV: ${err.message}`);
        setIsImporting(false);
      },
    });
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
        <div className="space-y-2">
            <label htmlFor="csv-importer" className="block text-sm font-medium text-gray-700">
                Selecione o arquivo CSV
            </label>
            <Input
                id="csv-importer"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isImporting}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
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
                <p className='mb-2'>O arquivo deve ter as colunas: <strong>dayOfWeek, time, petName, frequency</strong>.</p>
                <ul className="list-disc list-inside text-xs space-y-1">
                    <li><strong>dayOfWeek:</strong> Use 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'.</li>
                    <li><strong>time:</strong> Use o formato HH:mm (ex: 14:00).</li>
                    <li><strong>petName:</strong> O nome do pet.</li>
                    <li><strong>frequency:</strong> Use 'semanal' ou 'quinzenal'.</li>
                </ul>
            </AlertDescription>
        </Alert>

      </CardContent>
    </Card>
  );
}
