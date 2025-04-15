Assunto: Melhoria de Performance e Escalabilidade da Aplicação Casa dos Escritores
Objetivo: Identificar e implementar melhorias na aplicação, começando pela página inicial (src/app/page.js), para torná-la mais rápida, escalável e fácil de manter.
Plano de Ação (4 Etapas):
Otimizar Busca de Dados e Índices da Página Inicial: Mover a lógica de agregação (Recentes, Mais Comentados, Top Escritores) para Funções RPC no Supabase, refatorar page.js para usar essas funções e garantir índices adequados no banco.
Refatorar a Página Inicial em Componentes Modulares: Extrair as seções da página inicial para Server Components dedicados.
Revisão e Otimização de Queries e Índices em Áreas Críticas: Aplicar otimizações de banco de dados em outras partes da aplicação.
Otimização do Frontend e Estratégias de Caching: Refinar o uso de componentes Next.js, otimizar imagens e implementar estratégias de cache.
Progresso Realizado:
Etapa 1 concluída com sucesso:
Foram criadas três Funções PostgreSQL (RPC) no Supabase:
get_top_writers(limit_count INT)
get_recent_content(limit_count INT)
get_most_commented_content(limit_count INT)
O arquivo src/app/page.js foi refatorado:
A lógica complexa de busca e agregação de dados foi removida.
As chamadas às novas funções RPC foram implementadas usando Promise.all para execução paralela.
O JSX foi ajustado para consumir os dados retornados pelas RPCs.
Foram verificados e adicionados os índices necessários nas tabelas stories, chapters, comments e profiles para otimizar a performance das funções RPC.
Um bug na função get_top_writers (tipo de retorno incorreto NUMERIC vs BIGINT) foi identificado e corrigido.
A funcionalidade da página inicial foi validada e está exibindo os dados corretamente após as otimizações.
Próximo Passo:
Iniciar a Etapa 2: Refatorar a Página Inicial em Componentes Modulares, criando os componentes RecentContentList, MostCommentedList e TopWritersList.