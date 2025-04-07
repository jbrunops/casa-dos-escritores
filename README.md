# Casa dos Escritores

<div align="center">
  <img src="public/images/logo.png" alt="Casa dos Escritores Logo" width="150">
  <h3>Plataforma de Compartilhamento e Publicação de Conteúdo Literário</h3>
</div>

## 📚 Visão Geral

Casa dos Escritores é uma plataforma completa para escritores publicarem suas histórias, organizá-las em séries e conectarem-se com leitores. O projeto oferece um ambiente intuitivo para criação, gerenciamento e consumo de conteúdo literário em português, com foco em uma experiência fluida tanto para autores quanto para leitores.

## 🌟 Funcionalidades Principais

### 📝 Gerenciamento de Conteúdo
- **Histórias Individuais**: Publicação de contos e histórias independentes
- **Séries com Capítulos**: Organização de histórias em séries contínuas
- **Editor Rico**: Interface WYSIWYG para formatação de textos
- **Categorização**: Organização por gêneros/categorias para facilitar descoberta
- **Estatísticas**: Contagem de visualizações, palavras e tempo estimado de leitura

### 👤 Perfis e Usuários
- **Registro e Autenticação**: Sistema completo de cadastro e login
- **Perfis Personalizáveis**: Informações do autor, foto e dados de contato
- **Dashboard**: Interface centralizada para gerenciar histórias e séries
- **Estatísticas Pessoais**: Visão geral de desempenho e métricas do autor

### 🔔 Interação Social
- **Comentários**: Sistema para leitores interagirem com autores
- **Visualizações**: Contagem e exibição de visualizações por história
- **Navegação por Autor**: Exploração de outras obras do mesmo escritor
- **Compartilhamento**: Links para compartilhar histórias em redes sociais

### 🎨 Interface e Design
- **Design Responsivo**: Adaptação perfeita para dispositivos móveis e desktop
- **Tema Consistente**: Experiência visual uniforme com cores padronizadas (#484DB5 e #E5E7EB)
- **Acessibilidade**: Interfaces pensadas para diferentes necessidades
- **Navegação Intuitiva**: Menus e fluxos de uso simplificados

## 🛠️ Tecnologias Utilizadas

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/) com variáveis customizadas
- **Editor de Texto**: [TipTap](https://tiptap.dev/) (baseado em ProseMirror)
- **Ícones**: [Lucide React](https://lucide.dev/)

### Backend
- **BaaS**: [Supabase](https://supabase.com/) 
- **Banco de Dados**: PostgreSQL (via Supabase)
- **Autenticação**: Sistema de login integrado do Supabase
- **Storage**: Armazenamento de imagens (avatares, etc)

### Infraestrutura
- **Deploy**: Vercel (Frontend) + Supabase (Backend)
- **CI/CD**: Integração contínua via GitHub Actions
- **Monitoramento**: Vercel Analytics e Supabase Metrics

## 📊 Estrutura do Projeto

```
casa-dos-escritores/
│
├── public/                   # Arquivos estáticos
│   └── images/               # Imagens do site
│
├── src/                      # Código-fonte da aplicação
│   ├── app/                  # App Router do Next.js
│   │   ├── (auth)/           # Rotas de autenticação
│   │   ├── admin/            # Área administrativa
│   │   ├── dashboard/        # Dashboard do usuário
│   │   ├── profile/          # Perfil público
│   │   ├── story/            # Visualização de histórias
│   │   └── series/           # Visualização de séries
│   │
│   ├── components/           # Componentes reutilizáveis
│   │   ├── Comments.js       # Sistema de comentários
│   │   ├── StoryContent.js   # Exibição de conteúdo das histórias
│   │   └── TipTapEditor.js   # Editor de textos
│   │
│   ├── contexts/             # Contextos React
│   │   └── AuthContext.js    # Gerenciamento de autenticação
│   │
│   ├── lib/                  # Bibliotecas e adaptadores
│   │   ├── supabase-browser.js # Cliente Supabase (browser)
│   │   └── supabase-server.js  # Cliente Supabase (server)
│   │
│   └── utils/                # Utilitários e funções auxiliares
│       └── userRoles.js      # Controle de permissões
│
├── middleware.js             # Middleware do Next.js
└── package.json              # Dependências do projeto
```

## 🚀 Instalação e Uso

### Pré-requisitos
- Node.js 18.x ou superior
- NPM ou Yarn
- Conta no Supabase

### Configuração do Ambiente
1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/casadosescritores.git
   cd casadosescritores
   ```

2. Instale as dependências:
   ```bash
   npm install
   # ou
   yarn
   ```

3. Configure as variáveis de ambiente:
   ```
   # .env.local
   NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
   ```

4. Execute o projeto localmente:
   ```bash
   npm run dev
   # ou
   yarn dev
   ```

5. Acesse `http://localhost:3000` no navegador

### Estrutura do Banco de Dados (Supabase)

O projeto utiliza as seguintes tabelas principais:

- **auth.users**: Gerenciada pelo Supabase Auth
- **profiles**: Informações complementares dos usuários
- **stories**: Histórias individuais e capítulos
- **series**: Agrupamento de histórias em séries
- **comments**: Comentários nas histórias

## 🎯 Guia de Contribuição

1. Faça um fork do repositório
2. Crie uma branch para sua feature: `git checkout -b minha-feature`
3. Commit suas mudanças: `git commit -m 'Adiciona minha feature'`
4. Push para a branch: `git push origin minha-feature`
5. Abra um Pull Request

### Padrões de Código
- Utilize TypeScript para tipagem segura
- Siga as práticas de componentização do React
- Mantenha compatibilidade com dispositivos móveis
- Documente novas funcionalidades

## 📝 Documentação de Estilos

O projeto segue uma estrutura de CSS organizada:

- **Cores Principais**: 
  - Primária: `#484DB5` (azul)
  - Bordas: `#E5E7EB` (cinza claro)
  - Texto: `#111827` (cinza escuro)
  - Fundo: `#FFFFFF` (branco)

- **Organização**:
  - Componentes com estilos autocontidos
  - Utilitários através do Tailwind CSS
  - Estilos específicos para dispositivos móveis

## 📄 Licença

Este projeto está licenciado sob a licença [MIT](LICENSE).

## 📞 Contato e Suporte

- **Site**: [casadosescritores.com.br](https://casadosescritores.com.br)
- **Email**: contato@casadosescritores.com.br
- **GitHub**: [github.com/seu-usuario/casadosescritores](https://github.com/seu-usuario/casadosescritores)

---

Desenvolvido com ❤️ para escritores brasileiros