# Casa dos Escritores - Plataforma de Conteúdo Literário

Casa dos Escritores é uma plataforma dedicada a escritores que desejam compartilhar suas histórias, organizá-las em séries e conectar-se com leitores. O projeto oferece um ambiente amigável para a criação e consumo de conteúdo literário.

## Funcionalidades Principais

### Gerenciamento de Usuários
- **Registro e Autenticação**: Sistema completo de registro, login e recuperação de senha
- **Perfis de Usuário**: Cada escritor possui um perfil público com suas informações e obras
- **Dashboard Personalizado**: Interface centralizada para gerenciar histórias e séries
- **Gestão de Avatar**: Upload e personalização de imagem de perfil

### Histórias Individuais
- **Criação e Edição**: Editor rico com formatação de texto para escrever histórias
- **Categorização**: Organização por gêneros e tags para melhor descoberta
- **Visualização**: Interface de leitura otimizada para diferentes dispositivos
- **Métricas**: Contagem de visualizações e estatísticas de texto (palavras, tempo de leitura)

### Séries
- **Organização em Capítulos**: Criação de séries com múltiplos capítulos
- **Gerenciamento de Ordem**: Definição da sequência de leitura dos capítulos
- **Navegação Intuitiva**: Interface para navegar entre capítulos da mesma série
- **Status da Série**: Indicador se a série está completa ou em andamento

### Sistema de Notificações
- **Notificações em Tempo Real**: Alertas para interações como comentários, curtidas e novos seguidores
- **Central de Notificações**: Página dedicada para gerenciar todas as notificações
- **Filtros de Notificações**: Opções para filtrar por notificações lidas e não lidas
- **Badges Visuais**: Indicadores numéricos para notificações não lidas
- **Marcar como Lido**: Opções para marcar notificações individuais ou todas como lidas

### Social
- **Perfis Públicos**: Páginas de perfil mostrando as obras de cada autor
- **Destaques**: Seção na página inicial com séries e histórias populares
- **Compartilhamento**: Links para compartilhar histórias em redes sociais
- **Comentários**: Sistema para interação entre leitores e autores

### Interface
- **Design Responsivo**: Adaptação completa para dispositivos móveis e desktop
- **Editor de Texto Rico**: Interface WYSIWYG para formatação de conteúdo
- **Tema Consistente**: Design visual coeso entre todas as páginas
- **Menu Mobile Otimizado**: Interface específica para navegação em dispositivos móveis

### Experiência Mobile
- **Menu Lateral Adaptativo**: Menu de navegação deslizante otimizado para telas pequenas
- **Layout Responsivo**: Ajustes automáticos de layout baseados no tamanho da tela
- **Elementos Touch-Friendly**: Botões e controles maiores para facilitar interação em telas de toque
- **Performance Otimizada**: Carregamento rápido mesmo em conexões móveis

## Estrutura do ProjetO

```
casa-dos-escritores/
│
├── public/                   # Arquivos estáticos
│   ├── favicon.ico
│   └── images/               # Imagens do site
│
├── eslint.config.mjs         # Configuração do ESLint
├── next.config.mjs           # Configuração do Next.js
├── src/                      # Código-fonte da aplicação
│   ├── app/                  # Pastas de rotas do Next.js App Router
│   │   ├── api/              # Endpoints da API
│   │   │   ├── auth/         # Autenticação
│   │   │   ├── stories/      # Operações de histórias
│   │   │   └── users/        # Operações de usuários
│   │   ├── dashboard/        # Painel do usuário
│   │   ├── profile/          # Página de perfil
│   │   ├── story/            # Página de história
│   │   └── layout.js         # Layout global
│   │
│   ├── components/           # Componentes React reutilizáveis
│   │   ├── AuthForm.js       # Formulário de autenticação
│   │   ├── DarkModeToggle.js # Alternador de tema
│   │   ├── Header.js         # Cabeçalho do site
│   │   ├── Sidebar.js        # Barra lateral
│   │   └── TipTapEditor.js   # Editor de texto rico
│   │
│   ├── lib/                  # Bibliotecas e utilitários
│   │   ├── supabase-browser.js # Cliente Supabase para browser
│   │   ├── supabase-server.js  # Cliente Supabase para server
│   │   └── utils.js          # Funções utilitárias
│   │
│   └── styles/               # Estilos CSS
│       ├── base/             # Estilos base e variáveis
│       │   ├── variables.css # Variáveis CSS (cores, espaçamentos)
│       │   ├── reset.css     # Reset de estilos
│       │   ├── typography.css # Tipografia
│       │   ├── utilities.css # Classes utilitárias
│       │   └── mobile/       # Versões mobile dos estilos base
│       │
│       ├── layout/           # Estilos de estrutura
│       │   ├── grid.css      # Sistema de grid
│       │   ├── header.css    # Cabeçalho
│       │   ├── footer.css    # Rodapé
│       │   ├── sidebar.css   # Barra lateral
│       │   └── mobile/       # Versões mobile dos layouts
│       │
│       ├── components/       # Estilos de componentes
│       │   ├── buttons.css   # Botões
│       │   ├── cards.css     # Cards
│       │   ├── forms.css     # Formulários
│       │   ├── alerts.css    # Alertas e mensagens
│       │   └── mobile/       # Versões mobile dos componentes
│       │
│       └── pages/            # Estilos específicos de páginas
│           ├── home.css      # Página inicial
│           ├── auth.css      # Páginas de autenticação
│           ├── profile.css   # Página de perfil
│           ├── story.css     # Página de história
│           └── mobile/       # Versões mobile das páginas
│
└── package.json              # Dependências do projeto
```

## Tecnologias Utilizadas

- **Frontend**: Next.js com React 
- **Backend**: Supabase (PostgreSQL, Autenticação, Armazenamento)
- **Notificações**: Sistema em tempo real com Supabase Realtime
- **Editor**: TipTap (baseado em ProseMirror)
- **Estilização**: CSS com variáveis para temas
- **Ícones**: Lucide React
- **Responsividade**: Media queries e layouts adaptativos

## Detalhes Técnicos

### Sistema de Notificações

O sistema de notificações utiliza a funcionalidade de canais em tempo real do Supabase para entregar alertas instantâneos aos usuários. A arquitetura implementada inclui:

- **Tabela de Notificações**: Armazenamento de notificações com campos para tipo, conteúdo, status de leitura e metadados adicionais
- **Canais de Tempo Real**: Assinatura a eventos de banco de dados para atualizações instantâneas
- **Processamento de Eventos**: Lógica para tratamento de diferentes tipos de notificações
- **Interface de Usuário Reativa**: Atualização automática do badge de notificações e da lista de mensagens

### Experiência Mobile-First

A aplicação segue princípios de design mobile-first com otimizações específicas:

- **Estrutura CSS Modular**: Separação de estilos base e específicos para mobile
- **Detecção de Viewport**: Ajuste dinâmico da interface baseado no tamanho de tela
- **Economia de Recursos**: Carregamento condicional de componentes para otimizar performance
- **Interações Touch-Optimized**: Áreas de toque aumentadas e feedback visual para interações em dispositivos móveis

### Performance

Otimizações implementadas para garantir uma experiência fluida:

- **Renderização Condicional**: Componentes carregados apenas quando necessários
- **Gerenciamento de Estado Eficiente**: Uso de React Hooks para minimizar re-renderizações
- **Lazy Loading**: Carregamento sob demanda para conteúdo abaixo da dobra
- **Compressão de Assets**: Otimização de imagens e recursos estáticos

A Casa dos Escritores oferece uma experiência completa tanto para escritores quanto para leitores, com foco em usabilidade, organização de conteúdo, notificações em tempo real e uma interface responsiva para todas as plataformas.

# Casa dos Escritores - Estrutura de Estilos

Este projeto utiliza uma estrutura modular e organizada para os arquivos CSS, facilitando a manutenção e escalabilidade do código.

## Estrutura de Arquivos

```
src/styles/
├── base/                  # Estilos base e primitivos
│   ├── colors.css         # Variáveis de cores
│   ├── typography.css     # Estilos de tipografia
│   ├── spacing.css        # Variáveis de espaçamento
│   ├── mobile/            # Estilos base para mobile
│   │   ├── typography.css # Tipografia mobile
│   │   └── elements.css   # Elementos básicos mobile
│   └── index.css          # Arquivo índice para importação
├── layout/                # Estilos de layout e estrutura
│   ├── grid.css           # Sistema de grid
│   ├── header.css         # Estilos do cabeçalho
│   ├── footer.css         # Estilos do rodapé
│   ├── mobile/            # Estilos de layout para mobile
│   │   ├── grid.css       # Grid mobile
│   │   └── header.css     # Cabeçalho mobile
│   └── index.css          # Arquivo índice para importação
├── components/            # Estilos de componentes reutilizáveis
│   ├── buttons.css        # Estilos de botões
│   ├── cards.css          # Cartões e containers
│   ├── forms.css          # Formulários e campos
│   ├── navigation.css     # Navegação e menus
│   ├── tables.css         # Tabelas
│   ├── chapters.css       # Componentes de capítulos
│   ├── notifications.css  # Componentes de notificações
│   ├── mobile/            # Estilos de componentes para mobile
│   │   ├── buttons.css    # Botões mobile
│   │   └── ...            # Outros componentes mobile
│   └── index.css          # Arquivo índice para importação
└── pages/                 # Estilos específicos de páginas
    ├── home.css           # Página inicial
    ├── profile.css        # Página de perfil
    ├── dashboard.css      # Painel do usuário
    ├── editor.css         # Editor (estilos comuns)
    ├── editor-story.css   # Editor de histórias
    ├── editor-series.css  # Editor de séries
    ├── story.css          # Página de história
    ├── series.css         # Página de série
    ├── chapter.css        # Página de capítulo
    ├── mobile/            # Estilos de páginas para mobile
    │   ├── home.css       # Página inicial mobile
    │   └── ...            # Outras páginas mobile
    └── index.css          # Arquivo índice para importação
```

## Convenções de Nomenclatura

- As classes seguem o padrão de nomenclatura orientado a componentes.
- Prefixos são usados para indicar o contexto (por exemplo, `btn-` para botões).
- Modificadores são separados por hífens (por exemplo, `btn-primary`, `btn-large`).

## Hierarquia de Importação

O arquivo `globals.css` importa todos os arquivos de estilo na seguinte ordem:

1. Base - Estilos fundamentais e variáveis
2. Layout - Estrutura e grid
3. Componentes - Elementos reutilizáveis 
4. Páginas - Estilos específicos de páginas
5. Mobile - Responsividade para dispositivos móveis

## Responsividade

Os estilos responsivos são organizados em arquivos separados para facilitar a manutenção:

- Os estilos para tablet estão em media queries de `max-width: 768px`
- Os estilos para mobile estão em media queries de `max-width: 480px`

## Variáveis CSS

Variáveis CSS são utilizadas para cores, espaçamento, sombras e outros valores:

- `var(--color-*)` - Sistema de cores
- `var(--space-*)` - Sistema de espaçamento
- `var(--shadow-*)` - Sistema de sombras
- `var(--radius-*)` - Sistema de border-radius