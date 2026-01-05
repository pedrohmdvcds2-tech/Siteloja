# Guia: Como Publicar Seu Site na Vercel

Parabéns! Ter o código no seu computador e no GitHub é o primeiro grande passo. Agora, vamos publicar seu site no ar para que todos possam ver. Usaremos a Vercel, uma plataforma otimizada para projetos Next.js como o seu.

O processo é bastante simples:

### Passo 1: Crie uma Conta na Vercel

1.  Acesse [vercel.com](https://vercel.com).
2.  Clique em **"Sign Up"** (Inscrever-se).
3.  A maneira mais fácil é continuar com sua conta do **GitHub**. Escolha essa opção e autorize a Vercel a acessar seus repositórios.

### Passo 2: Importe seu Projeto do GitHub

1.  Após o login, você será levado ao seu painel (dashboard). Clique em **"Add New..."** e depois em **"Project"**.
2.  A Vercel mostrará uma lista dos seus repositórios do GitHub. Encontre o repositório do seu projeto (ex: `meu-petshop`) e clique em **"Import"**.

### Passo 3: Configure o Projeto

A Vercel é inteligente e já vai detectar que seu projeto é feito com Next.js, então a maioria das configurações já virá preenchida.

1.  **Framework Preset:** Verifique se está como `Next.js`.
2.  **Root Directory:** Deixe como está.

**A parte mais importante é aqui: configurar o Firebase.**

3.  **Environment Variables (Variáveis de Ambiente):**
    Seu site precisa das "chaves" para se conectar ao Firebase. Você precisa copiar os valores do seu arquivo `src/firebase/config.ts` e colá-los nas variáveis de ambiente da Vercel.

    *   Abra a seção **Environment Variables**.
    *   Para cada item dentro do `firebaseConfig` no seu código, crie uma nova variável na Vercel. **É crucial que o nome comece com `NEXT_PUBLIC_`**.

    Faça o seguinte, copiando o valor correspondente do seu arquivo:

    | Nome da Variável na Vercel             | Valor (Copie do seu arquivo `src/firebase/config.ts`) |
    | -------------------------------------- | ----------------------------------------------------- |
    | `NEXT_PUBLIC_FIREBASE_PROJECT_ID`      | O valor de `projectId`                                |
    | `NEXT_PUBLIC_FIREBASE_APP_ID`          | O valor de `appId`                                    |
    | `NEXT_PUBLIC_FIREBASE_API_KEY`         | O valor de `apiKey`                                   |
    | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`     | O valor de `authDomain`                               |
    | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | O valor de `messagingSenderId`                        |


### Passo 4: Faça o Deploy!

1.  Depois de adicionar as variáveis de ambiente, clique no botão **"Deploy"**.
2.  A Vercel começará a "construir" seu site. Isso pode levar alguns minutos.
3.  Quando terminar, você verá uma tela de parabéns com a foto do seu site e o link para acessá-lo (algo como `meu-petshop.vercel.app`).

Pronto! Seu site está online.

---

### Dica Importante:

Sempre que você enviar novas alterações para a branch `main` do seu GitHub (`git push origin main`), a Vercel irá automaticamente fazer um novo deploy com as atualizações. Você não precisa repetir esse processo manual.