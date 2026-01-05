# Guia: Como Baixar o Código do Seu Projeto

Olá! Aqui está um guia passo a passo para ajudá-lo a baixar o código do seu site para o seu computador. Existem dois métodos principais: **Exportar como ZIP** (mais rápido e simples) ou usar o **Git** (melhor para desenvolvimento contínuo).

---

## Método 1: Exportar o Projeto como um Arquivo ZIP (Recomendado para Início Rápido)

Esta é a maneira mais fácil de obter uma cópia completa do seu projeto. Na interface do Firebase Studio, você deve procurar por uma opção de exportação ou download.

**Onde procurar:**

1.  **Menu Superior:** Verifique menus como "File" (Arquivo), "Project" (Projeto) ou um menu com três pontos verticais (`⋮`).
2.  **Opções Comuns:** Procure por itens de menu com nomes como:
    *   `Export to .zip`
    *   `Download Project`
    *   `Baixar Código`
    *   `Exportar Projeto`

Ao encontrar e clicar nessa opção, o Firebase Studio irá compactar todos os arquivos do seu site (`src`, `public`, `package.json`, etc.) em um único arquivo `.zip` e iniciar o download para o seu computador.

Depois de baixar, basta descompactar o arquivo e você terá o projeto pronto para rodar localmente.

---

## Método 2: Usar o Git e o GitHub (Recomendado para Desenvolvimento Contínuo)

Este método é um pouco mais envolvido, mas é o padrão para desenvolvimento de software, pois permite que você salve o histórico de alterações e colabore com outras pessoas.

### Passo 1: Configurar um Repositório no GitHub

1.  Vá para [GitHub.com](https://github.com/) e crie uma conta se ainda não tiver uma.
2.  Crie um novo repositório clicando em "New". Dê um nome a ele (ex: `meu-petshop`) e mantenha-o público ou privado, como preferir. **Não** inicialize com um `README` ou `.gitignore`.

### Passo 2: Conectar Seu Projeto ao GitHub no Firebase Studio

Agora, você precisa conectar o ambiente de desenvolvimento atual ao repositório que acabou de criar.

1.  **Abra o Terminal:** Procure por uma aba ou janela de "Terminal" ou "Console" no Firebase Studio.
2.  **Execute os Comandos Git:** Digite os seguintes comandos, um de cada vez, pressionando Enter após cada um. Substitua `[URL_DO_SEU_REPO_NO_GITHUB]` pela URL que o GitHub forneceu (algo como `https://github.com/seu-usuario/meu-petshop.git`).

    ```bash
    # Inicializa o Git no projeto
    git init -b main

    # Adiciona todos os arquivos para o Git "observar"
    git add .

    # Cria um "snapshot" inicial das suas alterações
    git commit -m "Primeiro commit do projeto PetShop"

    # Conecta seu projeto local ao repositório do GitHub
    git remote add origin [URL_DO_SEU_REPO_NO_GITHUB]

    # Envia os arquivos para o GitHub
    git push -u origin main
    ```

    *Pode ser que ele peça seu nome de usuário e senha (ou um token) do GitHub para autorizar o envio.*

### Passo 3: Baixar (Clonar) o Projeto para o Seu Computador

Com o projeto no GitHub, agora você pode baixá-lo em qualquer máquina.

1.  **Instale o Git:** Se você ainda não tem o Git no seu computador, [baixe-o aqui](https://git-scm.com/downloads).
2.  **Abra o Terminal (no seu computador):**
    *   No Windows, você pode usar o Git Bash (que vem com a instalação do Git) ou o Terminal do Windows.
    *   No Mac ou Linux, use o aplicativo Terminal.
3.  **Clone o Repositório:** Navegue até a pasta onde você quer salvar o projeto e execute o comando abaixo:

    ```bash
    git clone [URL_DO_SEU_REPO_NO_GITHUB]
    ```

Pronto! Uma nova pasta com o nome do seu projeto será criada, contendo todo o código.

---

Se tiver qualquer dificuldade em algum desses passos, pode me perguntar!