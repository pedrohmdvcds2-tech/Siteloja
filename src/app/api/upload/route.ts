'use server';
import { NextRequest, NextResponse } from 'next/server';

const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID || 'd38803a4b13d2b2';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const imageFormData = new FormData();
    imageFormData.append('image', file);
    imageFormData.append('type', 'file');

    const imgurResponse = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
      },
      body: imageFormData,
    });

    if (!imgurResponse.ok) {
      const errorData = await imgurResponse.json();
      console.error('Erro no upload para o Imgur:', errorData);
      return NextResponse.json(
        {
          error: 'Falha no upload da imagem para o serviço externo.',
          details: errorData,
        },
        { status: imgurResponse.status }
      );
    }

    const { data } = await imgurResponse.json();
    
    if (!data.link) {
        return NextResponse.json({ error: 'A resposta da API de imagem não continha um link.' }, { status: 500 });
    }

    // Retorna a URL da imagem hospedada no Imgur
    return NextResponse.json({ url: data.link });
    
  } catch (error: any) {
    console.error('Erro na API de upload interna:', error);
    return NextResponse.json({ error: 'Erro interno do servidor ao processar o upload.', details: error.message }, { status: 500 });
  }
}
