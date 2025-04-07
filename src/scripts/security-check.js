#!/usr/bin/env node
/**
 * Script de verificação de segurança
 * Executa verificações em configurações de segurança críticas
 * 
 * Uso: node security-check.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const chalk = require('chalk');

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

// Função para imprimir mensagens formatadas
function printResult(test, passed, message, details = '') {
  if (passed) {
    console.log(chalk.green(`✓ PASSOU: ${test}`));
  } else {
    console.log(chalk.red(`✗ FALHOU: ${test}`));
    console.log(chalk.yellow(`  Detalhes: ${message}`));
    if (details) {
      console.log(chalk.gray(`  ${details}`));
    }
    console.log();
  }
}

// Array para armazenar os resultados dos testes
const results = {
  passed: 0,
  failed: 0,
  total: 0
};

// Verificar existência de arquivos sensíveis em .gitignore
function checkGitignore() {
  try {
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    
    const requiredEntries = [
      '.env',
      '.env.local',
      '.env.*.local',
      'node_modules',
      '.vercel',
    ];
    
    for (const entry of requiredEntries) {
      const isIncluded = gitignoreContent.includes(entry);
      results.total++;
      
      if (isIncluded) {
        results.passed++;
      } else {
        results.failed++;
      }
      
      printResult(
        `Verificar se ${entry} está no .gitignore`,
        isIncluded,
        `${entry} não encontrado no .gitignore`,
        'Arquivos sensíveis devem ser adicionados ao .gitignore para evitar vazamento de dados'
      );
    }
  } catch (error) {
    console.error('Erro ao verificar .gitignore:', error);
  }
}

// Verificar variáveis de ambiente
function checkEnvironmentVariables() {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  for (const varName of requiredVars) {
    const exists = !!process.env[varName];
    results.total++;
    
    if (exists) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    printResult(
      `Verificar se ${varName} está definido`,
      exists,
      `${varName} não está definido`,
      'Variáveis de ambiente críticas devem ser configuradas para o funcionamento do aplicativo'
    );
  }
}

// Verificar configurações de segurança do Supabase
async function checkSupabaseConfig() {
  try {
    // Verificar se temos as credenciais necessárias
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log(chalk.yellow('⚠ AVISO: Não foi possível verificar a configuração do Supabase devido a credenciais ausentes'));
      return;
    }
    
    // Criar cliente Supabase com a service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Verificar RLS em tabelas importantes
    const tables = [
      'admin_logs', 
      'chapters', 
      'comments', 
      'notifications', 
      'profiles', 
      'series', 
      'stories'
    ];
    
    console.log('\nVerificando RLS nas tabelas:');
    for (const table of tables) {
      // Verificar se RLS está ativado
      const { data, error } = await supabase.rpc('check_rls_enabled', { table_name: table });
      
      if (error) {
        console.log(chalk.yellow(`⚠ AVISO: Não foi possível verificar RLS para a tabela ${table}: ${error.message}`));
        continue;
      }
      
      const rlsEnabled = data;
      results.total++;
      
      if (rlsEnabled) {
        results.passed++;
      } else {
        results.failed++;
      }
      
      printResult(
        `Verificar RLS na tabela ${table}`,
        rlsEnabled,
        `Row Level Security não está ativado para a tabela ${table}`,
        'Todas as tabelas devem ter RLS ativado para segurança dos dados'
      );
      
      // Verificar políticas
      const { data: policies, error: policiesError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', table);
      
      if (policiesError) {
        console.log(chalk.yellow(`⚠ AVISO: Não foi possível verificar políticas para a tabela ${table}: ${policiesError.message}`));
        continue;
      }
      
      const hasPolicies = policies && policies.length > 0;
      results.total++;
      
      if (hasPolicies) {
        results.passed++;
      } else {
        results.failed++;
      }
      
      printResult(
        `Verificar políticas na tabela ${table}`,
        hasPolicies,
        `Nenhuma política encontrada para a tabela ${table}`,
        'Tabelas com RLS devem ter políticas apropriadas definidas'
      );
    }
  } catch (error) {
    console.error('Erro ao verificar configuração do Supabase:', error);
  }
}

// Função principal
async function main() {
  console.log(chalk.bold.blue('=== VERIFICAÇÃO DE SEGURANÇA ==='));
  console.log(chalk.blue(`Data: ${new Date().toLocaleString()}`));
  console.log(chalk.blue(`Ambiente: ${process.env.NODE_ENV || 'desenvolvimento'}`));
  console.log();
  
  // Executar verificações
  checkGitignore();
  checkEnvironmentVariables();
  
  // Verificar se temos as variáveis necessárias antes de criar o cliente
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log(chalk.yellow('\n⚠ AVISO: Não foi possível verificar as configurações do Supabase'));
    console.log(chalk.yellow('  As variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias'));
    
    // Exibir resumo
    showSummary();
    return;
  }
  
  // Configurar a função de RPC para verificar RLS
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Criar função RPC para verificar RLS (apenas se ela não existir)
    const { error } = await supabase.rpc('create_check_rls_function');
    if (error && !error.message.includes('already exists')) {
      console.log(chalk.yellow(`⚠ AVISO: Não foi possível criar função de verificação de RLS: ${error.message}`));
      
      // Tentar criá-la diretamente
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION check_rls_enabled(table_name text)
          RETURNS boolean
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          DECLARE
            result boolean;
          BEGIN
            SELECT INTO result relrowsecurity 
            FROM pg_class 
            JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
            WHERE pg_namespace.nspname = 'public' AND relname = table_name;
            
            RETURN result;
          END;
          $$;
          
          CREATE OR REPLACE FUNCTION create_check_rls_function()
          RETURNS void
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            -- Função já criada, não faz nada
          END;
          $$;
        `
      });
    }
    
    await checkSupabaseConfig();
  } catch (error) {
    console.error('Erro ao conectar com o Supabase:', error);
  }
  
  // Exibir resumo
  showSummary();
}

// Função para mostrar o resumo
function showSummary() {
  console.log(chalk.bold.blue('\n=== RESUMO ==='));
  console.log(`Total de testes: ${results.total}`);
  console.log(chalk.green(`Testes passados: ${results.passed}`));
  console.log(chalk.red(`Testes falhados: ${results.failed}`));
  
  const passRate = results.total > 0 ? (results.passed / results.total) * 100 : 0;
  console.log(chalk.blue(`Taxa de aprovação: ${passRate.toFixed(2)}%`));
  
  if (results.failed > 0) {
    console.log(chalk.yellow('\nRecomendações:'));
    console.log('1. Ative Row Level Security (RLS) em todas as tabelas');
    console.log('2. Defina políticas de segurança para todas as tabelas com RLS ativado');
    console.log('3. Certifique-se de que todas as variáveis de ambiente estejam configuradas');
    console.log('4. Adicione arquivos sensíveis ao .gitignore');
  }
}

// Executar o script
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Erro:', error);
    process.exit(1);
  }); 