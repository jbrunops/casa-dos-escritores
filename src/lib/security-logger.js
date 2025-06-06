/**
 * Sistema de Logs de Segurança
 * Monitora e registra eventos críticos de segurança
 */

// Tipos de eventos de segurança
export const SECURITY_EVENTS = {
    AUTH_FAILURE: 'AUTH_FAILURE',
    AUTH_SUCCESS: 'AUTH_SUCCESS',
    ADMIN_ACCESS: 'ADMIN_ACCESS',
    RATE_LIMIT_HIT: 'RATE_LIMIT_HIT',
    UPLOAD_ATTEMPT: 'UPLOAD_ATTEMPT',
    UPLOAD_BLOCKED: 'UPLOAD_BLOCKED',
    SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
    DATA_BREACH_ATTEMPT: 'DATA_BREACH_ATTEMPT',
    PRIVILEGE_ESCALATION: 'PRIVILEGE_ESCALATION',
    MALICIOUS_INPUT: 'MALICIOUS_INPUT'
};

// Níveis de severidade
export const SEVERITY_LEVELS = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
};

/**
 * Registra evento de segurança
 * @param {string} event - Tipo do evento (SECURITY_EVENTS)
 * @param {string} severity - Nível de severidade (SEVERITY_LEVELS)
 * @param {Object} details - Detalhes do evento
 * @param {Request} request - Objeto de requisição (opcional)
 */
export function logSecurityEvent(event, severity, details, request = null) {
    const timestamp = new Date().toISOString();
    
    // Obter informações da requisição se disponível
    let requestInfo = {};
    if (request) {
        requestInfo = {
            ip: getClientIP(request),
            userAgent: request.headers.get('user-agent') || 'unknown',
            url: request.url,
            method: request.method,
            referer: request.headers.get('referer') || 'none'
        };
    }

    const logEntry = {
        timestamp,
        event,
        severity,
        details,
        request: requestInfo,
        sessionId: generateSessionId()
    };

    // Log estruturado para diferentes ambientes
    if (process.env.NODE_ENV === 'production') {
        // Em produção, usar formato JSON estruturado
        console.log(JSON.stringify({
            type: 'SECURITY_EVENT',
            ...logEntry
        }));
    } else {
        // Em desenvolvimento, formato mais legível
        console.warn(`🚨 [SECURITY] ${severity} - ${event}`, {
            timestamp,
            details,
            request: requestInfo
        });
    }

    // Em produção, aqui você enviaria para um serviço de monitoramento
    // como DataDog, Sentry, CloudWatch, etc.
    if (process.env.NODE_ENV === 'production' && severity === SEVERITY_LEVELS.CRITICAL) {
        // Exemplo: enviar alerta crítico
        sendCriticalAlert(logEntry);
    }
}

/**
 * Log específico para tentativas de autenticação
 * @param {boolean} success - Se a autenticação foi bem-sucedida
 * @param {string} userId - ID do usuário (se disponível)
 * @param {string} email - Email usado na tentativa
 * @param {Request} request - Objeto de requisição
 */
export function logAuthAttempt(success, userId, email, request) {
    const event = success ? SECURITY_EVENTS.AUTH_SUCCESS : SECURITY_EVENTS.AUTH_FAILURE;
    const severity = success ? SEVERITY_LEVELS.LOW : SEVERITY_LEVELS.MEDIUM;
    
    logSecurityEvent(event, severity, {
        userId: userId || 'unknown',
        email: email || 'unknown',
        success
    }, request);
}

/**
 * Log para acesso administrativo
 * @param {string} adminId - ID do administrador
 * @param {string} action - Ação realizada
 * @param {string} targetId - ID do alvo da ação (se aplicável)
 * @param {Request} request - Objeto de requisição
 */
export function logAdminAction(adminId, action, targetId, request) {
    logSecurityEvent(SECURITY_EVENTS.ADMIN_ACCESS, SEVERITY_LEVELS.HIGH, {
        adminId,
        action,
        targetId: targetId || 'none'
    }, request);
}

/**
 * Log para rate limiting
 * @param {string} endpoint - Endpoint que foi limitado
 * @param {number} attempts - Número de tentativas
 * @param {Request} request - Objeto de requisição
 */
export function logRateLimitHit(endpoint, attempts, request) {
    const severity = attempts > 50 ? SEVERITY_LEVELS.HIGH : SEVERITY_LEVELS.MEDIUM;
    
    logSecurityEvent(SECURITY_EVENTS.RATE_LIMIT_HIT, severity, {
        endpoint,
        attempts,
        possibleAttack: attempts > 100
    }, request);
}

/**
 * Log para uploads suspeitos
 * @param {string} userId - ID do usuário
 * @param {string} fileName - Nome do arquivo
 * @param {string} reason - Motivo do bloqueio
 * @param {Request} request - Objeto de requisição
 */
export function logSuspiciousUpload(userId, fileName, reason, request) {
    logSecurityEvent(SECURITY_EVENTS.UPLOAD_BLOCKED, SEVERITY_LEVELS.HIGH, {
        userId,
        fileName,
        reason,
        potentialMalware: reason.includes('malware') || reason.includes('virus')
    }, request);
}

/**
 * Log para entrada maliciosa detectada
 * @param {string} inputType - Tipo de entrada (comment, form, etc.)
 * @param {string} maliciousContent - Conteúdo suspeito (sanitizado para log)
 * @param {string} userId - ID do usuário (se disponível)
 * @param {Request} request - Objeto de requisição
 */
export function logMaliciousInput(inputType, maliciousContent, userId, request) {
    // Sanitizar conteúdo malicioso para o log
    const sanitizedContent = maliciousContent
        .replace(/<script/gi, '&lt;script')
        .replace(/javascript:/gi, 'javascript-blocked:')
        .substring(0, 200); // Limitar tamanho

    logSecurityEvent(SECURITY_EVENTS.MALICIOUS_INPUT, SEVERITY_LEVELS.HIGH, {
        inputType,
        sanitizedContent,
        userId: userId || 'anonymous',
        possibleXSS: maliciousContent.includes('<script') || maliciousContent.includes('javascript:'),
        possibleSQLi: maliciousContent.includes('UNION') || maliciousContent.includes('DROP TABLE')
    }, request);
}

/**
 * Log para tentativas de escalação de privilégios
 * @param {string} userId - ID do usuário
 * @param {string} attemptedAction - Ação que tentou realizar
 * @param {string} currentRole - Role atual do usuário
 * @param {Request} request - Objeto de requisição
 */
export function logPrivilegeEscalation(userId, attemptedAction, currentRole, request) {
    logSecurityEvent(SECURITY_EVENTS.PRIVILEGE_ESCALATION, SEVERITY_LEVELS.CRITICAL, {
        userId,
        attemptedAction,
        currentRole,
        requiresImmedateAttention: true
    }, request);
}

/**
 * Obtém IP do cliente de forma segura
 * @param {Request} request - Objeto de requisição
 * @returns {string} IP do cliente
 */
function getClientIP(request) {
    // Verificar headers de proxy em ordem de prioridade
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    
    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP.trim();
    }
    
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    if (cfConnectingIP) {
        return cfConnectingIP.trim();
    }
    
    return 'unknown';
}

/**
 * Gera ID de sessão único para correlacionar eventos
 * @returns {string} ID da sessão
 */
function generateSessionId() {
    return `sec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Envia alerta crítico (implementar integração com serviço de monitoramento)
 * @param {Object} logEntry - Entrada de log
 */
function sendCriticalAlert(logEntry) {
    // TODO: Implementar integração com serviço de alertas
    // Exemplos: Slack webhook, email, PagerDuty, etc.
    
    console.error('🚨 ALERTA CRÍTICO DE SEGURANÇA 🚨', {
        event: logEntry.event,
        timestamp: logEntry.timestamp,
        details: logEntry.details
    });
    
    // Em produção, implementar:
    // - Webhook para Slack/Discord
    // - Email para equipe de segurança
    // - Integração com PagerDuty/OpsGenie
    // - Notificação push para administradores
}

/**
 * Obtém estatísticas de eventos de segurança (para dashboard)
 * @param {number} hours - Número de horas para análise (padrão: 24)
 * @returns {Object} Estatísticas dos eventos
 */
export function getSecurityStats(hours = 24) {
    // Em produção, isso consultaria um banco de dados ou serviço de logs
    // Por enquanto, retorna estrutura de exemplo
    
    return {
        timeframe: `${hours} hours`,
        totalEvents: 0,
        eventsByType: {},
        eventsBySeverity: {
            [SEVERITY_LEVELS.LOW]: 0,
            [SEVERITY_LEVELS.MEDIUM]: 0,
            [SEVERITY_LEVELS.HIGH]: 0,
            [SEVERITY_LEVELS.CRITICAL]: 0
        },
        topIPs: [],
        recommendations: []
    };
} 