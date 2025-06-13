/**
 * Utilitários de sanitização server-side para proteger contra XSS
 */

import { logMaliciousInput } from './security-logger.js';

// Tags HTML permitidas para conteúdo de histórias
const ALLOWED_TAGS = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'strong', 'em', 'u', 'i',
    'ul', 'ol', 'li', 'blockquote',
    'a', 'img', 'pre', 'code',
    'div', 'span'
];

// Atributos permitidos por tag
const ALLOWED_ATTRIBUTES = {
    'a': ['href', 'title', 'target', 'rel'],
    'img': ['src', 'alt', 'title', 'width', 'height'],
    'div': ['class', 'data-align'],
    'span': ['class'],
    'p': ['class', 'data-align'],
    'h1': ['class'], 'h2': ['class'], 'h3': ['class'],
    'h4': ['class'], 'h5': ['class'], 'h6': ['class'],
    'blockquote': ['class'],
    'pre': ['class'],
    'code': ['class'],
    'mark': ['class']
};

// Protocolos permitidos para links
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:'];

/**
 * Destaca termo de busca de forma segura contra XSS
 * @param {string} text - Texto a ser destacado
 * @param {string} query - Termo de busca
 * @returns {string} Texto com destaque seguro
 */
export function safeHighlightText(text, query) {
    if (!text || !query || typeof text !== 'string' || typeof query !== 'string') {
        return escapeHtml(text || '');
    }

    // Escapar HTML no texto original
    const escapedText = escapeHtml(text);
    
    // Escapar caracteres especiais na consulta
    const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    
    // Criar regex para buscar o termo (case insensitive)
    const regex = new RegExp(`(${safeQuery})`, "gi");
    
    // Aplicar destaque apenas em texto já escapado
    return escapedText.replace(regex, '<mark class="bg-yellow-200 rounded px-0.5">$1</mark>');
}

/**
 * Escapa caracteres HTML para prevenir XSS
 * @param {string} text - Texto a ser escapado
 * @returns {string} Texto escapado
 */
export function escapeHtml(text) {
    if (!text || typeof text !== 'string') {
        return '';
    }
    
    const htmlEscapes = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };
    
    return text.replace(/[&<>"']/g, char => htmlEscapes[char]);
}

/**
 * Sanitiza HTML removendo tags e atributos perigosos
 * @param {string} html - HTML a ser sanitizado
 * @param {Object} options - Opções de sanitização
 * @returns {string} HTML sanitizado
 */
export function sanitizeHTML(html, options = {}) {
    if (!html || typeof html !== 'string') {
        return '';
    }

    const allowedTags = options.allowedTags || ALLOWED_TAGS;
    const allowedAttributes = options.allowedAttributes || ALLOWED_ATTRIBUTES;
    
    // Detectar conteúdo malicioso antes da sanitização
    const maliciousPatterns = [
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
        /on\w+\s*=/i,
        /expression\s*\(/i,
        /<iframe/i,
        /<object/i,
        /<embed/i
    ];
    
    const isMalicious = maliciousPatterns.some(pattern => pattern.test(html));
    if (isMalicious && options.userId) {
        logMaliciousInput('html_content', html, options.userId, options.request);
    }
    
    // Remover scripts e outros elementos perigosos
    let sanitized = html
        // Remover scripts
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        // Remover event handlers
        .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
        // Remover javascript: URLs
        .replace(/javascript:/gi, '')
        // Remover data: URLs (exceto imagens)
        .replace(/data:(?!image\/)/gi, '')
        // Remover vbscript:
        .replace(/vbscript:/gi, '')
        // Remover style com expressões
        .replace(/style\s*=\s*["'][^"']*expression\s*\([^"']*["']/gi, '');

    // Validar e limpar tags
    sanitized = sanitized.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/gi, (match, tagName) => {
        const tag = tagName.toLowerCase();
        
        // Verificar se a tag é permitida
        if (!allowedTags.includes(tag)) {
            return '';
        }

        // Para tags de fechamento, apenas retornar se permitida
        if (match.startsWith('</')) {
            return `</${tag}>`;
        }

        // Para tags de abertura, validar atributos
        const allowedAttrs = allowedAttributes[tag] || [];
        const cleanedMatch = match.replace(/\s+([a-zA-Z-]+)\s*=\s*["']([^"']*)["']/g, (attrMatch, attrName, attrValue) => {
            const attr = attrName.toLowerCase();
            
            if (!allowedAttrs.includes(attr)) {
                return '';
            }

            // Validações específicas por atributo
            if (attr === 'href' || attr === 'src') {
                if (!isValidURL(attrValue)) {
                    return '';
                }
            }

            return ` ${attr}="${escapeAttribute(attrValue)}"`;
        });

        return cleanedMatch;
    });

    return sanitized.trim();
}

/**
 * Sanitiza texto simples removendo caracteres perigosos
 * @param {string} text - Texto a ser sanitizado
 * @param {number} maxLength - Tamanho máximo permitido
 * @returns {string} Texto sanitizado
 */
export function sanitizeText(text, maxLength = 1000) {
    if (!text || typeof text !== 'string') {
        return '';
    }

    return text
        .replace(/[<>]/g, '') // Remover < e >
        .replace(/&(?!amp;|lt;|gt;|quot;|#39;)/g, '&amp;') // Escapar & não escapados
        .trim()
        .substring(0, maxLength);
}

/**
 * Sanitiza entrada de comentário
 * @param {string} comment - Comentário a ser sanitizado
 * @returns {string} Comentário sanitizado
 */
export function sanitizeComment(comment) {
    if (!comment || typeof comment !== 'string') {
        return '';
    }

    // Para comentários, permitir apenas formatação básica
    const commentOptions = {
        allowedTags: ['p', 'br', 'strong', 'em', 'u', 'i', 'a'],
        allowedAttributes: {
            'a': ['href', 'title']
        }
    };

    return sanitizeHTML(comment, commentOptions);
}

/**
 * Valida se uma URL é segura
 * @param {string} url - URL a ser validada
 * @returns {boolean} True se a URL é válida e segura
 */
function isValidURL(url) {
    if (!url || typeof url !== 'string') {
        return false;
    }

    try {
        const urlObj = new URL(url);
        
        // Verificar protocolo
        if (!ALLOWED_PROTOCOLS.includes(urlObj.protocol)) {
            return false;
        }

        // Bloquear URLs suspeitas
        const suspiciousPatterns = [
            /javascript:/i,
            /vbscript:/i,
            /data:/i,
            /file:/i,
            /ftp:/i
        ];

        return !suspiciousPatterns.some(pattern => pattern.test(url));
    } catch {
        return false;
    }
}

/**
 * Escapa atributos HTML
 * @param {string} value - Valor do atributo
 * @returns {string} Valor escapado
 */
function escapeAttribute(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

/**
 * Valida e sanitiza dados de entrada de formulário
 * @param {Object} data - Dados do formulário
 * @param {Object} rules - Regras de validação
 * @returns {Object} { isValid: boolean, sanitizedData: Object, errors: Array }
 */
export function validateAndSanitizeForm(data, rules) {
    const sanitizedData = {};
    const errors = [];

    for (const [field, rule] of Object.entries(rules)) {
        const value = data[field];

        // Verificar se campo obrigatório
        if (rule.required && (!value || value.trim() === '')) {
            errors.push(`Campo ${field} é obrigatório`);
            continue;
        }

        if (!value) {
            sanitizedData[field] = rule.default || '';
            continue;
        }

        // Aplicar sanitização baseada no tipo
        switch (rule.type) {
            case 'text':
                sanitizedData[field] = sanitizeText(value, rule.maxLength);
                break;
            case 'html':
                sanitizedData[field] = sanitizeHTML(value, rule.htmlOptions);
                break;
            case 'comment':
                sanitizedData[field] = sanitizeComment(value);
                break;
            case 'email':
                sanitizedData[field] = sanitizeText(value, 255).toLowerCase();
                if (sanitizedData[field] && !isValidEmail(sanitizedData[field])) {
                    errors.push(`${field} deve ser um email válido`);
                }
                break;
            case 'url':
                sanitizedData[field] = sanitizeText(value, 500);
                if (sanitizedData[field] && !isValidURL(sanitizedData[field])) {
                    errors.push(`${field} deve ser uma URL válida`);
                }
                break;
            default:
                sanitizedData[field] = sanitizeText(value);
        }

        // Verificar tamanho mínimo
        if (rule.minLength && sanitizedData[field].length < rule.minLength) {
            errors.push(`${field} deve ter pelo menos ${rule.minLength} caracteres`);
        }
    }

    return {
        isValid: errors.length === 0,
        sanitizedData,
        errors
    };
}

/**
 * Valida formato de email
 * @param {string} email - Email a ser validado
 * @returns {boolean} True se o email é válido
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
} 