# Casa dos Escritores 📖✍️

## Descrição do Projeto

Casa dos Escritores é uma plataforma web para escritores compartilharem histórias, comentarem, interagirem e desenvolverem sua comunidade literária. Construída com Next.js, Supabase e CSS puro com media queries, a aplicação oferece uma experiência completa de publicação e leitura.

## Recursos Principais

### Para Escritores

-   📝 Criação de histórias com editor rico em recursos
    -   Suporte a formatação avançada
    -   Visualização prévia em tempo real
    -   Contagem de palavras e tempo estimado de leitura
-   🏷️ Categorização de histórias
-   💾 Salvamento de rascunhos
-   📊 Estatísticas de visualização por história
-   ✏️ Edição e gerenciamento de histórias publicadas

### Interação e Comunidade

-   💬 Sistema de comentários avançado
    -   Comentários aninhados
    -   Respostas diretas
    -   Moderação de comentários
-   👥 Perfis de usuário personalizáveis
    -   Avatar personalizado
    -   Biografia
    -   Links para redes sociais
-   🔍 Sistema de busca abrangente
    -   Busca por histórias
    -   Busca por escritores
    -   Filtros e categorias

### Descoberta de Conteúdo

-   🏠 Página inicial dinâmica
    -   Histórias recentes
    -   Histórias mais comentadas
    -   Top 10 escritores
-   📚 Exploração por categorias
-   🔔 Sistema de notificações

### Gestão e Administração

-   👑 Painel administrativo completo
    -   Gerenciamento de usuários
    -   Moderação de conteúdo
    -   Exclusão de histórias e comentários
    -   Controle de permissões de usuários

### Segurança e Autenticação

-   🔐 Sistema de registro e login seguro
-   📧 Confirmação de email
-   🛡️ Proteção de rotas
-   👮 Níveis de acesso (usuário, moderador, admin)

### Experiência do Usuário

-   📱 Design responsivo com media queries
-   🌓 Tema claro/escuro (preparado para implementação)
-   ⚡ Carregamento rápido
-   🖼️ Suporte a imagens em histórias

## Tecnologias Utilizadas

-   **Frontend**: Next.js 15
-   **Estilização**:
    -   CSS Puro
    -   Media Queries
    -   Variáveis CSS
-   **Backend**: Supabase
-   **Autenticação**: Supabase Auth
-   **Editor de Texto**: Tiptap
-   **Bibliotecas Adicionais**:
    -   Lucide React (ícones)
    -   DOMPurify (sanitização de HTML)
    -   React Hooks

## Pré-requisitos

-   Node.js 18+
-   npm ou yarn
-   Conta no Supabase

## Configuração do Projeto

1. Clone o repositório

```bash
git clone https://github.com/jbrunops/casa-dos-escritores.git
cd casa-dos-escritores
```

2. Instale as dependências

```bash
npm install
# ou
yarn install
```

3. Configure as variáveis de ambiente

-   Crie um arquivo `.env.local` na raiz do projeto
-   Adicione suas credenciais do Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=seu-url-do-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-de-servico
```

4. Rode as migrações do banco de dados (se aplicável)

```bash
npx supabase migration up
```

5. Inicie o servidor de desenvolvimento

```bash
npm run dev
# ou
yarn dev
```

## Estrutura do Projeto

```
src/
├── app/                # Rotas e páginas
├── components/         # Componentes reutilizáveis
├── lib/                # Utilitários e configurações
├── styles/             # Estilos globais e CSS
└── utils/              # Funções utilitárias
```

## Deploy

Configurações para implantação:

-   **Provedor Recomendado**: Vercel
-   **Build Command**: `npm run build`
-   **Start Command**: `npm start`

### Variáveis de Ambiente Necessárias

-   `NEXT_PUBLIC_SUPABASE_URL`
-   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
-   `SUPABASE_SERVICE_ROLE_KEY`

## Contribuição

1. Faça um fork do projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

## Contato

João Brunops - [jbrunops@gmail.com](mailto:jbrunops@gmail.com)

Link do Projeto: [https://github.com/jbrunops/casa-dos-escritores](https://github.com/jbrunops/casa-dos-escritores)

## Considerações Finais

**Nota**: Este projeto foi desenvolvido como um ambiente de escrita colaborativa, permitindo que escritores compartilhem e interajam com suas histórias de forma intuitiva e envolvente.

### Melhorias Futuras

-   [ ] Implementação de tema escuro
-   [ ] Sistema de seguidores
-   [ ] Exportação de histórias
-   [ ] Integração com serviços de publicação

## Agradecimentos

-   Supabase pela infraestrutura backend
-   Next.js pelo framework frontend
-   Todos os colaboradores e escritores que tornam esta plataforma possível
