'use server';
import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { firebaseConfig } from '@/firebase/config';

// Helper to safely initialize Firebase Admin
function initializeFirebaseAdmin(): App {
  const apps = getApps();
  if (apps.length) {
    return apps[0]!;
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined;

  return initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : undefined,
    storageBucket: firebaseConfig.storageBucket,
  });
}

export async function POST(request: NextRequest) {
  try {
    initializeFirebaseAdmin();
    const storage = getStorage();
    const bucket = storage.bucket();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário não fornecido.' }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    const filePath = `vaccination-cards/${userId}/${fileName}`;

    const fileUpload = bucket.file(filePath);

    await fileUpload.save(fileBuffer, {
      metadata: {
        contentType: file.type,
      },
    });

    const [url] = await fileUpload.getSignedUrl({
      action: 'read',
      expires: '03-09-2491', // Far future date
    });

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error('Erro no upload da API:', error);
    let errorMessage = 'Erro interno do servidor ao fazer upload do arquivo.';
    
    // Check for specific Firebase/Google Cloud errors
    if (error.code === 404 || (error.message && error.message.includes('does not exist'))) {
        errorMessage = 'O bucket de armazenamento não foi encontrado. Verifique se o Firebase Storage está ativado.';
    } else if (error.code === 403) {
        errorMessage = 'Permissão negada para acessar o bucket de armazenamento. Verifique as regras de segurança e as credenciais da conta de serviço.';
    } else if (error.name === 'FirebaseAppError') {
        errorMessage = `Erro de configuração do Firebase Admin: ${error.message}`;
    }

    return NextResponse.json({ error: errorMessage, details: error.message }, { status: 500 });
  }
}
