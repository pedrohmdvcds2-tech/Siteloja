
import { NextResponse } from 'next/server';
import { getStorage } from 'firebase-admin/storage';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin(): App {
    // Check if there are already initialized apps
    if (getApps().length > 0) {
        return getApps()[0] as App;
    }

    // If not initialized, create a new instance.
    // This handles different environments (local vs. Vercel)
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : undefined;

    // Use cert only if serviceAccount is available
    const credential = serviceAccount ? cert(serviceAccount) : undefined;

    return initializeApp({
        credential, // credential will be undefined if serviceAccount is not set
        storageBucket: firebaseConfig.storageBucket,
    });
}

export async function POST(request: Request) {
    try {
        initializeFirebaseAdmin();
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const uid = formData.get('uid') as string | null;

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
        }

        if (!uid) {
            return NextResponse.json({ error: 'Usuário não autenticado.' }, { status: 400 });
        }

        const storage = getStorage();
        const bucket = storage.bucket();

        // Create a buffer from the file
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        // Define the path in the storage bucket
        const filePath = `vaccination-cards/${uid}/${Date.now()}-${file.name}`;
        const fileRef = bucket.file(filePath);

        // Upload the file
        await fileRef.save(fileBuffer, {
            metadata: {
                contentType: file.type,
            },
        });
        
        // Make the file public to get a URL - this can be slow.
        // A more robust solution might use signed URLs.
        await fileRef.makePublic();

        // Get the public URL
        const downloadURL = fileRef.publicUrl();

        return NextResponse.json({ url: downloadURL });

    } catch (error: any) {
        console.error('--- Upload API Error ---', error);
        // Provide a more specific error message if available
        const errorMessage = error.message || 'Ocorreu um erro desconhecido durante o upload.';
        return NextResponse.json({ error: `Erro interno do servidor: ${errorMessage}` }, { status: 500 });
    }
}
