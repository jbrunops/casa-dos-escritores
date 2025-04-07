/**
 * Utilitários para manipulação de dados e formatação
 */

import { customAlphabet } from 'nanoid';

/**
 * Gera um slug seguro a partir de um título e ID
 * @param {string} title - O título a ser transformado em slug
 * @param {string|number} id - O ID a ser adicionado ao slug para unicidade
 * @returns {string} Slug formatado seguro para URLs
 */
export function generateSlug(title, id) {
  if (!title || !id) return id || '';
  
  // Normalizar o título: remover acentos, converter para minúsculas
  const normalizedTitle = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')  // Remove caracteres especiais exceto espaços e hífens
    .replace(/\s+/g, '-')      // Substitui espaços por hífens
    .replace(/--+/g, '-')      // Remove hífens duplicados
    .trim()
    .substring(0, 80);         // Limita tamanho do slug
  
  return `${normalizedTitle}-${id}`;
}

/**
 * Extrai o ID numérico ou UUID de um slug
 * @param {string} slug - O slug a ser processado
 * @returns {string|null} O ID extraído ou null se não encontrado
 */
export function extractIdFromSlug(slug) {
  if (!slug) return null;
  
  // Se o slug já é um UUID válido, retorna diretamente
  if (isValidUUID(slug)) {
    return slug;
  }
  
  // Formato: titulo-do-post-ID
  const lastDashIndex = slug.lastIndexOf('-');
  if (lastDashIndex === -1) return slug;
  
  const potentialId = slug.substring(lastDashIndex + 1);
  
  // Verifique se o ID em potencial é um UUID válido
  if (isValidUUID(potentialId)) {
    return potentialId;
  }
  
  // Tente encontrar qualquer UUID no slug
  const uuidPattern = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
  const match = slug.match(uuidPattern);
  
  if (match && match[1]) {
    return match[1];
  }
  
  return slug; // Retorna o slug original como fallback
}

/**
 * Formata a data em português
 * @param {string} dateString - String de data ISO
 * @returns {string} Data formatada
 */
export function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Calcula o tempo estimado de leitura
 * @param {string} content - Conteúdo HTML
 * @returns {number} Minutos de leitura
 */
export function calculateReadingTime(content) {
  // Remover tags HTML e contar palavras
  const wordCount = content
    .replace(/<[^>]*>/g, '')
    .split(/\s+/)
    .length;
  
  // Assumir média de 200 palavras por minuto
  return Math.max(1, Math.round(wordCount / 200));
}

// Funções de segurança para validação e sanitização

/**
 * Sanitiza strings para prevenir XSS
 * @param {string} text - Texto a ser sanitizado
 * @returns {string} - Texto sanitizado
 */
export function sanitizeText(text) {
  if (!text) return '';
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Valida o formato de um email
 * @param {string} email - Email para validar
 * @returns {boolean} - Se o email é válido
 */
export function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Valida a força de uma senha
 * @param {string} password - Senha para validar
 * @returns {Object} - Status de validação e mensagem de erro
 */
export function validatePasswordStrength(password) {
  if (!password || password.length < 8) {
    return { valid: false, message: 'A senha deve ter pelo menos 8 caracteres' };
  }
  
  // Verificar por letras maiúsculas, minúsculas e números
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    return { 
      valid: false, 
      message: 'A senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número' 
    };
  }
  
  return { valid: true };
}

/**
 * Gera um token CSRF seguro
 * @returns {string} - Token CSRF
 */
export function generateCSRFToken() {
  // Usar caracteres seguros e um tamanho suficientemente grande
  const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 32);
  return nanoid();
}

/**
 * Verifica se uma string é um UUID válido
 */
export function isValidUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}
