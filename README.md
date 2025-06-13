# Casa dos Escritores

Uma plataforma literária moderna construída com Next.js, projetada para escritores publicarem seus trabalhos e construírem uma comunidade em torno da narrativa digital.

## Visão Geral

Casa dos Escritores é uma aplicação web full-stack que facilita a criação de conteúdo e o engajamento da comunidade para escritores e leitores. A plataforma oferece gerenciamento abrangente de conteúdo, autenticação de usuários e recursos de interação social.

## Stack Tecnológico

### Tecnologias Principais
- **Framework**: Next.js 15.2.4 (App Router)
- **Runtime**: React 19.1.0
- **Linguagem**: JavaScript/TypeScript
- **Estilização**: Tailwind CSS 3.4.17
- **Backend**: Supabase (PostgreSQL + Auth + RPC)
- **Editor**: Tiptap 2.11.5 (Editor de Texto Rico)
- **Componentes UI**: Lucide React (Ícones)

### Dependências de Desenvolvimento
- **Linting**: ESLint 9
- **Estilização**: PostCSS, Autoprefixer
- **Ferramentas de Build**: TypeScript 5.8.3
- **Utilitários**: date-fns, DOMPurify, nanoid

## Arquitetura

### Estrutura da Aplicação
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rotas de autenticação
│   ├── admin/             # Painel administrativo
│   ├── api/               # Endpoints da API
│   ├── categories/        # Categorização de conteúdo
│   ├── dashboard/         # Dashboard do usuário
│   ├── notifications/     # Sistema de notificações
│   ├── profile/           # Perfis de usuário
│   ├── search/            # Funcionalidade de busca
│   ├── series/            # Gerenciamento de séries
│   └── story/             # Gerenciamento de histórias
├── components/            # Componentes React
├── lib/                   # Utilitários e configurações
│   ├── supabase-client.js # Supabase client-side
│   ├── supabase-server.js # Supabase server-side
│   └── utils.js           # Funções auxiliares
└── styles/                # Estilos globais
```

## Funcionalidades Principais

### Autenticação e Autorização
- Integração com Supabase Auth
- Controle de acesso baseado em funções (RBAC)
- Rotas protegidas e middleware
- Gerenciamento de sessões

### Gerenciamento de Conteúdo
- **Histórias**: Obras literárias individuais
- **Capítulos**: Segmentos de histórias em múltiplas partes
- **Séries**: Coleções de conteúdo relacionado
- Edição de texto rico com Tiptap
- Fluxo de publicação de conteúdo
- Estados de rascunho e publicado

### Experiência do Usuário
- Design responsivo
- Descoberta dinâmica de conteúdo
- Navegação baseada em categorias
- Funcionalidade de busca
- Perfis de usuário e páginas de autor
- Interação social (comentários, seguidores)

### Descoberta de Conteúdo
- Séries em destaque
- Novos lançamentos
- Conteúdo recente
- Obras mais comentadas
- Escritores em destaque
- Navegação por categorias

### Recursos Administrativos
- Moderação de conteúdo
- Gerenciamento de usuários
- Dashboard de analytics
- Monitoramento do sistema

## Schema do Banco de Dados

A aplicação utiliza PostgreSQL via Supabase com as seguintes entidades principais:

### Tabelas Principais
- `profiles` - Perfis e metadados de usuários
- `stories` - Conteúdo de histórias individuais
- `series` - Coleções de histórias
- `chapters` - Segmentos de conteúdo em múltiplas partes
- `comments` - Interações dos usuários
- `categories` - Classificação de conteúdo

### Relacionamentos
- Um-para-muitos: Usuários para Histórias/Séries
- Um-para-muitos: Séries para Capítulos
- Muitos-para-muitos: Histórias para Categorias
- Um-para-muitos: Conteúdo para Comentários

## Arquitetura da API

### APIs Internas (`/api/`)
- Endpoints de autenticação
- Operações CRUD de conteúdo
- Manipulação de upload de arquivos
- Funções administrativas

### Integração com Supabase
- Chamadas para funções RPC para consultas complexas
- Assinaturas em tempo real
- Políticas de Row Level Security (RLS)
- Edge functions para computação serverless

## Implementação de Segurança

### Segurança de Autenticação
- Gerenciamento de sessões baseado em JWT
- Controle de acesso baseado em funções
- Endpoints de API protegidos
- Verificações de autenticação via middleware

### Segurança de Conteúdo
- Sanitização de entrada com DOMPurify
- Proteção contra XSS
- Proteção contra CSRF
- Prevenção de injeção SQL via RLS do Supabase

### Segurança de Infraestrutura
- Rate limiting em todos os endpoints
- Validação de upload de arquivos
- Content Security Policy (CSP)
- Implementação de headers de segurança

## Otimização de Performance

### Otimização do Frontend
- Server-side rendering (SSR)
- Geração estática para conteúdo público
- Otimização de imagens com Next.js Image
- Code splitting a nível de componente

### Otimização do Banco de Dados
- Consultas indexadas
- Funções RPC para operações complexas
- Connection pooling via Supabase
- Padrões otimizados de busca de dados

## Fluxo de Desenvolvimento

### Começando
```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp env-template.txt .env.local

# Executar servidor de desenvolvimento
npm run dev
```

### Configuração de Ambiente
Variáveis de ambiente necessárias:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Build e Deploy
```bash
# Build de produção
npm run build

# Iniciar servidor de produção
npm run start

# Linting de código
npm run lint
```

## Deploy

### Configuração da Vercel
A aplicação está otimizada para deploy na Vercel com:
- Deploys automáticos a partir do Git
- Gerenciamento de variáveis de ambiente
- Suporte a edge functions
- Analytics integrados

### Arquivos de Configuração
- `vercel.json` - Configuração de deployment
- `next.config.mjs` - Configurações de otimização do Next.js
- Headers de segurança e configuração CSP

## Monitoramento e Analytics

### Monitoramento da Aplicação
- Rastreamento e logging de erros
- Métricas de performance
- Analytics de usuário
- Monitoramento de eventos de segurança

### Business Intelligence
- Métricas de engajamento de conteúdo
- Analytics de comportamento do usuário
- Rastreamento de crescimento
- Estatísticas de uso da plataforma

## Contribuindo

### Padrões de Código
- Configuração ESLint para qualidade de código
- TypeScript para type safety
- Tailwind CSS para estilização consistente
- Arquitetura baseada em componentes

### Diretrizes de Desenvolvimento
- Seguir melhores práticas do Next.js
- Implementar error boundaries adequados
- Usar estrutura HTML semântica
- Manter padrões de acessibilidade

## Licença

Este projeto está sob a licença MIT. Todos os direitos reservados.

---

**Mantenedores**: Equipe de Desenvolvimento  
**Última Atualização**: Janeiro 2025  
**Versão do Next.js**: 15.2.4  
**Requisito Node.js**: >= 18.0.0
