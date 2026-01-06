'use server';
import { NextRequest, NextResponse } from 'next/server';

const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID || 'd38803a4b13d2b2';

export async function POST(request: NextRequest) {
  try {
    const requestFormData = await request.formData();
    const file = requestFormData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const imgurFormData = new FormData();
    imgurFormData.append('image', file);

    const imgurResponse = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
      },
      body: imgurFormData,
    });

    const responseData = await imgurResponse.json();

    if (!imgurResponse.ok) {
      console.error('Erro no upload para o Imgur:', responseData);
      return NextResponse.json(
        {
          error: 'Falha no upload da imagem para o serviço externo.',
          details: responseData,
        },
        { status: imgurResponse.status }
      );
    }
    
    if (!responseData.data.link) {
        return NextResponse.json({ error: 'A resposta da API de imagem não continha um link.' }, { status: 500 });
    }

    return NextResponse.json({ url: responseData.data.link });
    
  } catch (error: any) {
    console.error('Erro na API de upload interna:', error);
    return NextResponse.json({ error: 'Erro interno do servidor ao processar o upload.', details: error.message }, { status: 500 });
  }
}
