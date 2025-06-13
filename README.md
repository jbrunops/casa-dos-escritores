# Casa dos Escritores

Plataforma literária moderna desenvolvida com Next.js para escritores publicarem suas obras e construírem uma comunidade em torno da narrativa digital.

## Stack Tecnológica

- **Frontend**: Next.js 15.2.4, React 19.1.0, TypeScript 5.8.3
- **Styling**: Tailwind CSS 3.4.17, Framer Motion 12.6.3
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Editor**: TipTap (rich text editor)
- **Desenvolvimento**: ESLint, PostCSS, Autoprefixer

## Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta Supabase configurada

## Instalação

```bash
git clone https://github.com/jbrunops/casa-dos-escritores.git
cd casa-dos-escritores
npm install
```

## Configuração

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Desenvolvimento

```bash
# Servidor de desenvolvimento
npm run dev

# Build de produção
npm run build

# Executar build
npm run start

# Linting
npm run lint
```

## Funcionalidades

### Autenticação
- Login/registro via Supabase Auth
- Gerenciamento de sessões com SSR
- Perfis de usuário personalizáveis

### Sistema de Publicação
- Editor de texto rico com TipTap
- Upload e gerenciamento de imagens
- Categorização e tags
- Sistema de rascunhos e publicação

### Interação Social
- Sistema de seguir/seguidor
- Comentários e avaliações
- Feed personalizado
- Notificações em tempo real

### Performance
- Server-side rendering (SSR)
- Otimização de imagens
- Cache inteligente com SWR
- Lazy loading de componentes

## Estrutura do Projeto

```
casa-dos-escritores/
├── app/                    # App Router (Next.js 13+)
├── components/            # Componentes React reutilizáveis
├── lib/                   # Utilities e configurações
├── public/               # Assets estáticos
├── docs/                 # Documentação técnica
└── scripts/              # Scripts de desenvolvimento
```

## Deploy

### Vercel (Recomendado)

1. Conecte o repositório ao Vercel
2. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy automático via Git

### Outros Provedores

Suporte para deploy em Netlify, Railway, e outras plataformas que suportam Next.js.

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Consulte o arquivo LICENSE para mais detalhes.

## Suporte

Para reportar bugs ou solicitar features, abra uma issue no GitHub. 