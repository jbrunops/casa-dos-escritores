# Casa dos Escritores

**Plataforma literária moderna desenvolvida com Next.js para escritores publicarem suas obras e construírem uma comunidade em torno da narrativa digital.**

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.17-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

---

## Visão Geral

Casa dos Escritores é uma aplicação web full-stack que implementa uma plataforma de publicação literária com recursos avançados de segurança, performance e experiência do usuário. O projeto utiliza arquitetura moderna baseada em componentes React com renderização server-side e integração com backend-as-a-service.

### Características Técnicas Principais

- **Segurança Robusta**: Implementação completa de proteção CSRF, sanitização XSS, rate limiting e auditoria de segurança
- **Editor Avançado**: Integração TipTap com extensões customizadas para formatação rica e upload de mídia
- **Arquitetura Escalável**: Padrão de componentes reutilizáveis com hooks customizados e gerenciamento de estado
- **Performance Otimizada**: SSR/SSG, lazy loading, code splitting e cache inteligente
- **Sistema de Busca**: Implementação de busca full-text com highlighting seguro de resultados
- **Real-time Features**: Notificações e atualizações em tempo real via WebSocket

---

## Stack Tecnológica

### Frontend Framework
- **Next.js 15.2.4** - Framework React com App Router, SSR/SSG e otimizações automáticas
- **React 19.1.0** - Biblioteca de interface com Concurrent Features e Server Components
- **TypeScript 5.8.3** - Superset JavaScript com tipagem estática e inferência avançada

### Styling e UI
- **Tailwind CSS 3.4.17** - Framework CSS utility-first com design system customizado
- **Framer Motion 12.6.3** - Biblioteca de animações declarativas e transições fluidas
- **Lucide React 0.484.0** - Conjunto de ícones SVG otimizados e tree-shakeable

### Backend e Dados
- **Supabase** - Backend-as-a-Service com PostgreSQL, autenticação e storage
  - PostgreSQL com Row Level Security (RLS) para controle de acesso granular
  - Autenticação JWT com refresh tokens e session management
  - Storage de arquivos com políticas de acesso configuráveis
  - Real-time subscriptions via WebSocket
- **Supabase SSR 0.6.1** - Integração server-side com hidratação otimizada

### Editor e Conteúdo
- **TipTap 2.11.5** - Editor WYSIWYG extensível baseado em ProseMirror
  - Extensões: Heading, Image, Link, Typography, Text Align, Placeholder, Underline
  - Starter Kit com comandos básicos e shortcuts de teclado
  - Schema customizado para validação de conteúdo
- **DOMPurify 3.2.4** - Sanitização de HTML contra ataques XSS

### Performance e Cache
- **SWR 2.3.3** - Data fetching com cache, revalidação e sincronização
- **date-fns 4.1.0** - Biblioteca de manipulação de datas tree-shakeable
- **nanoid 5.1.5** - Gerador de IDs únicos criptograficamente seguros

### Desenvolvimento e Build
- **ESLint 9** - Linter configurado com regras customizadas para qualidade de código
- **PostCSS** - Processador CSS com plugins para autoprefixer e otimizações
- **Autoprefixer 10.4.21** - Adição automática de vendor prefixes
- **TypeScript Compiler** - Verificação de tipos em build time

---

## Arquitetura do Sistema

### Estrutura de Diretórios

```
src/
├── app/                           # App Router (Next.js 15+)
│   ├── api/                       # API Routes server-side
│   │   ├── admin/                 # Endpoints administrativos
│   │   ├── chapters/              # CRUD de capítulos
│   │   ├── comments/              # Sistema de comentários
│   │   ├── notifications/         # Notificações push
│   │   ├── register/              # Registro de usuários
│   │   ├── series/                # Gestão de séries
│   │   └── upload/                # Upload de arquivos
│   ├── auth/                      # Páginas de autenticação
│   ├── categories/                # Navegação por categorias
│   ├── chapter/                   # Visualização de capítulos
│   ├── create/                    # Interface de criação
│   ├── dashboard/                 # Painel administrativo
│   ├── profile/                   # Perfis de usuário
│   ├── search/                    # Sistema de busca
│   ├── series/                    # Visualização de séries
│   ├── story/                     # Visualização de histórias
│   ├── layout.js                  # Layout raiz com providers
│   ├── page.js                    # Homepage
│   └── globals.css                # Estilos globais e variáveis CSS
├── components/                    # Componentes React reutilizáveis
│   ├── Header.js                  # Navegação principal
│   ├── StoryContent.js            # Renderização de conteúdo sanitizado
│   └── [outros componentes]
├── contexts/                      # Context providers para estado global
├── hooks/                         # Custom hooks para lógica reutilizável
├── lib/                          # Bibliotecas e utilitários
│   ├── csrf-protection.js         # Middleware de proteção CSRF
│   ├── rate-limit.js              # Sistema de rate limiting
│   ├── sanitize.js                # Funções de sanitização
│   ├── security-logger.js         # Logging de eventos de segurança
│   ├── supabase-browser.js        # Cliente Supabase para browser
│   ├── supabase-server.js         # Cliente Supabase para server
│   └── utils.js                   # Utilitários gerais
├── utils/                         # Funções utilitárias específicas
└── middleware.js                  # Middleware de autenticação e roteamento
```

### Padrões Arquiteturais

**Component-First Architecture**: Componentes funcionais com hooks para lógica de estado e efeitos colaterais.

**Server-Side Rendering**: Páginas renderizadas no servidor para SEO e performance inicial otimizada.

**API Routes Pattern**: Endpoints RESTful implementados como funções serverless no Next.js.

**Middleware Chain**: Sistema de middleware para autenticação, CSRF, rate limiting e logging.

**Context + Hooks Pattern**: Gerenciamento de estado global com Context API e custom hooks.

---

## Implementações de Segurança

### Proteção contra Vulnerabilidades

**Cross-Site Scripting (XSS)**
- Sanitização de HTML com DOMPurify configurado com whitelist restritiva
- Escape de caracteres especiais em contextos de template
- Content Security Policy (CSP) configurado para prevenir execução de scripts maliciosos
- Validação de entrada em todos os pontos de interação do usuário

**Cross-Site Request Forgery (CSRF)**
- Validação de headers Origin e Referer em operações sensíveis
- Verificação de Content-Type para requisições POST/PUT/PATCH
- Whitelist de domínios permitidos para requisições cross-origin
- Logging de tentativas de bypass para análise de segurança

**Injection Attacks**
- Prepared statements e parameterização de queries via Supabase
- Validação rigorosa de tipos de dados e formatos
- Sanitização de entrada antes de processamento
- Row Level Security (RLS) no PostgreSQL para isolamento de dados

**File Upload Security**
- Verificação de magic numbers para validação real de tipo de arquivo
- Whitelist de tipos MIME e extensões permitidas
- Limitação de tamanho de arquivo e rate limiting de uploads
- Quarentena e scanning de arquivos antes de disponibilização

### Headers de Segurança

```javascript
// Configuração de headers implementada
{
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://supabase-instance.supabase.co",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'"
  ].join('; ')
}
```

### Auditoria e Monitoramento

**Security Logging**
- Eventos de autenticação e autorização
- Tentativas de acesso não autorizado
- Uploads suspeitos e validações falhadas
- Operações administrativas e mudanças de privilégios

**Rate Limiting**
- Implementação em memória com fallback para Redis em produção
- Limites configuráveis por endpoint e tipo de operação
- Throttling progressivo para tentativas repetidas
- Whitelist para IPs confiáveis

---

## Funcionalidades Técnicas

### Sistema de Autenticação
- **JWT Authentication** via Supabase Auth com refresh token rotation
- **Role-Based Access Control (RBAC)** com políticas granulares
- **Session Management** com timeout configurável e detecção de concorrência
- **Password Security** com hashing bcrypt e políticas de complexidade

### Editor de Conteúdo
- **Rich Text Editing** com TipTap e extensões customizadas
- **Real-time Collaboration** preparado para implementação futura
- **Auto-save** com debounce e sincronização de estado
- **Media Upload** com preview, redimensionamento e otimização

### Sistema de Busca
- **Full-Text Search** implementado com PostgreSQL tsvector
- **Faceted Search** com filtros por categoria, autor e data
- **Search Highlighting** com sanitização segura de resultados
- **Search Analytics** para otimização de relevância

### Performance e Otimização
- **Code Splitting** automático por rota e componente
- **Image Optimization** com Next.js Image component
- **Caching Strategy** multi-layer com SWR e CDN
- **Bundle Analysis** e tree-shaking para redução de tamanho

---

## Banco de Dados

### Schema Principal

**Tabelas Core**
- `profiles` - Perfis de usuário com metadados e preferências
- `stories` - Histórias individuais com conteúdo e metadados
- `series` - Coleções de histórias relacionadas
- `chapters` - Capítulos individuais de séries
- `comments` - Sistema de comentários aninhados
- `follows` - Relacionamentos de seguidor/seguido
- `notifications` - Sistema de notificações

**Políticas RLS**
```sql
-- Exemplo de política implementada
CREATE POLICY "Users can view published content" ON stories
  FOR SELECT USING (is_published = true OR author_id = auth.uid());

CREATE POLICY "Users can edit own content" ON stories
  FOR UPDATE USING (author_id = auth.uid());
```

### Índices e Performance
- Índices compostos para queries de busca frequentes
- Índices GIN para full-text search em PostgreSQL
- Particionamento por data para tabelas de alta volumetria
- Análise de query performance com EXPLAIN ANALYZE

---

## API Design

### RESTful Endpoints
```
GET    /api/stories              # Listar histórias
POST   /api/stories              # Criar história
GET    /api/stories/[id]         # Obter história específica
PUT    /api/stories/[id]         # Atualizar história
DELETE /api/stories/[id]         # Deletar história

POST   /api/upload               # Upload de arquivos
POST   /api/comments             # Criar comentário
GET    /api/search               # Busca global
```

### Response Patterns
```javascript
// Resposta padrão de sucesso
{
  "data": { /* payload */ },
  "meta": {
    "timestamp": "2025-01-27T10:00:00Z",
    "version": "1.0.0"
  }
}

// Resposta de erro
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos fornecidos",
    "details": { /* detalhes específicos */ }
  }
}
```

---

## Deployment e DevOps

### Build Configuration
```javascript
// next.config.mjs - Configurações de produção
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  images: {
    remotePatterns: [/* configuração de domínios permitidos */],
    formats: ['image/webp', 'image/avif']
  }
};
```

### Environment Variables
```bash
# Configurações necessárias (sem valores sensíveis)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RATE_LIMIT_MAX_REQUESTS=
RATE_LIMIT_WINDOW_MS=
```

### Performance Metrics
- **Core Web Vitals** otimizados para pontuação Lighthouse 90+
- **Time to First Byte (TTFB)** < 200ms
- **First Contentful Paint (FCP)** < 1.5s
- **Largest Contentful Paint (LCP)** < 2.5s

---

## Testes e Qualidade

### Testing Strategy
- **Unit Tests** para funções utilitárias e hooks
- **Integration Tests** para API endpoints
- **Component Tests** com React Testing Library
- **E2E Tests** para fluxos críticos de usuário
- **Security Tests** automatizados para vulnerabilidades conhecidas

### Code Quality
- **ESLint** com regras customizadas para padrões do projeto
- **TypeScript** strict mode para verificação de tipos
- **Prettier** para formatação consistente
- **Husky** para git hooks de pre-commit
- **Conventional Commits** para padronização de mensagens

---

## Documentação Técnica

- [Relatório de Segurança](./security-report.md) - Auditoria completa de segurança
- [Arquitetura do Sistema](./docs/ARCHITECTURE.md) - Detalhes arquiteturais
- [Guia de API](./docs/API.md) - Documentação de endpoints
- [Configuração de Banco](./docs/DATABASE.md) - Schema e políticas
- [Guia de Desenvolvimento](./docs/DEVELOPMENT.md) - Padrões e convenções

---

## Licença

Este projeto está licenciado sob a MIT License. Consulte o arquivo [LICENSE](LICENSE) para detalhes completos.

---

## Informações Técnicas

**Versão**: 1.0.0  
**Node.js**: >= 18.0.0  
**Compatibilidade**: Navegadores modernos com suporte a ES2022  
**Arquitetura**: Jamstack com SSR/SSG híbrido  
**Banco de Dados**: PostgreSQL 15+ com extensões habilitadas 