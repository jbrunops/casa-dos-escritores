# 🔒 Configuração de Segurança - Casa dos Escritores

## ⚠️ AÇÃO IMEDIATA NECESSÁRIA

As credenciais do Supabase foram removidas do código por questões de segurança. Siga estas instruções para configurar o ambiente corretamente.

## 1. Configurar Variáveis de Ambiente

### Desenvolvimento Local

1. Crie um arquivo `.env.local` na raiz do projeto:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://kkykesdoqdeagnuvlxao.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
```

2. Adicione o arquivo ao `.gitignore` (já configurado):
```
.env.local
```

### Produção (Vercel/Netlify)

Configure as variáveis de ambiente no painel de controle:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 
- `SUPABASE_SERVICE_ROLE_KEY`

## 2. Regenerar Chaves do Supabase

**IMPORTANTE**: As chaves antigas foram expostas e devem ser regeneradas:

1. Acesse o painel do Supabase
2. Vá em Settings > API
3. Regenere as chaves:
   - Anon key
   - Service role key
4. Atualize as variáveis de ambiente com as novas chaves

## 3. Verificar Configurações de Segurança

### Cabeçalhos de Segurança ✅
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Content Security Policy configurado
- Referrer Policy configurado

### Rate Limiting ✅
- Implementado para todos os endpoints críticos
- Limites configurados por tipo de operação
- Headers de rate limit incluídos nas respostas

### Validação de Upload ✅
- Tipos de arquivo permitidos: jpg, jpeg, png, webp
- Tamanho máximo: 5MB
- Validação de nome de arquivo
- Autenticação obrigatória

### Autenticação em Endpoints Administrativos ✅
- Verificação de sessão
- Verificação de role de administrador
- Logs de auditoria implementados

### Configuração Segura de Imagens ✅
- Apenas domínios confiáveis permitidos
- SVG desabilitado por segurança
- Cache configurado adequadamente

## 4. Monitoramento e Logs

### Logs de Auditoria
Os seguintes eventos são logados:
- Tentativas de acesso administrativo
- Uploads de arquivo
- Exclusões de usuário
- Falhas de autenticação

### Monitoramento Recomendado
- Configure alertas para múltiplas tentativas de login
- Monitore logs de rate limiting
- Acompanhe uploads suspeitos

## 5. Próximos Passos de Segurança

### Prioridade Alta (1 semana)
- [ ] Implementar 2FA para administradores
- [ ] Configurar backup automatizado
- [ ] Implementar escaneamento de malware em uploads
- [ ] Configurar rotação automática de logs

### Prioridade Média (2 semanas)
- [ ] Implementar CAPTCHA em formulários públicos
- [ ] Configurar WAF (Web Application Firewall)
- [ ] Implementar detecção de anomalias
- [ ] Configurar alertas de segurança

### Prioridade Baixa (1 mês)
- [ ] Realizar teste de penetração
- [ ] Implementar criptografia adicional
- [ ] Configurar análise de dependências automatizada
- [ ] Treinar equipe em práticas de segurança

## 6. Comandos Úteis

### Verificar Configuração
```bash
# Verificar se variáveis estão configuradas
npm run dev
# Verificar logs no console para confirmar configuração
```

### Testar Rate Limiting
```bash
# Fazer múltiplas requisições para testar limites
curl -X POST http://localhost:3000/api/comments \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Verificar Cabeçalhos de Segurança
```bash
# Verificar cabeçalhos de resposta
curl -I http://localhost:3000
```

## 7. Contatos de Emergência

Em caso de incidente de segurança:
1. Revogue imediatamente as chaves do Supabase
2. Verifique logs de acesso
3. Notifique a equipe de desenvolvimento
4. Documente o incidente

## 8. Checklist de Verificação

- [ ] Variáveis de ambiente configuradas
- [ ] Chaves do Supabase regeneradas
- [ ] Aplicação funcionando corretamente
- [ ] Rate limiting ativo
- [ ] Cabeçalhos de segurança presentes
- [ ] Upload de arquivos validado
- [ ] Endpoints administrativos protegidos
- [ ] Logs de auditoria funcionando

---

**Última atualização**: $(date)  
**Responsável**: Equipe de Desenvolvimento  
**Próxima revisão**: 30 dias 