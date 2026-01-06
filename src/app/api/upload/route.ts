
import { NextResponse } from 'next/server';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase-admin/storage';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin(): App {
    if (getApps().length > 0) {
        return getApps()[0] as App;
    }
    // IMPORTANT: Firebase Admin SDK requires service account credentials.
    // For Vercel, these should be set as environment variables.
    // The SDK automatically picks up GOOGLE_APPLICATION_CREDENTIALS for the JSON key
    // and can derive project_id from there. If not set, it might fail.
    // For local dev, you can use a service account file.
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT ? 
        JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : 
        undefined;

    return initializeApp({
        credential: serviceAccount ? require('firebase-admin').credential.cert(serviceAccount) : undefined,
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
        
        // Get the public URL
        const downloadURL = await getDownloadURL(fileRef);

        return NextResponse.json({ url: downloadURL });

    } catch (error: any) {
        console.error('--- Upload API Error ---', error);
        return NextResponse.json({ error: `Erro interno do servidor: ${error.message}` }, { status: 500 });
    }
}

    