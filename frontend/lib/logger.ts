// =====================================================
// 📋 STRUCTURED LOGGER — Fase 2.5
// Substitui console.log/error por logging estruturado
// Produção: JSON para integração com Sentry/DataDog
// Dev: Formatado para legibilidade
// =====================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  [key: string]: unknown;
}

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

class Logger {
  private formatLog(level: LogLevel, message: string, context?: LogContext): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    };
  }

  /**
   * Debug: Só aparece em dev. Útil para inspeção de dados.
   */
  debug(message: string, context?: LogContext): void {
    if (IS_DEVELOPMENT) {
      console.debug(
        `\x1b[36m[DEBUG]\x1b[0m ${message}`,
        context ? JSON.stringify(context, null, 2) : ''
      );
    }
  }

  /**
   * Info: Ações bem-sucedidas, fluxos normais.
   */
  info(message: string, context?: LogContext): void {
    const entry = this.formatLog('info', message, context);
    if (IS_PRODUCTION) {
      console.log(JSON.stringify(entry));
    } else {
      console.log(`\x1b[32m[INFO]\x1b[0m ${message}`, context || '');
    }
  }

  /**
   * Warn: Situações inesperadas mas não críticas.
   */
  warn(message: string, context?: LogContext): void {
    const entry = this.formatLog('warn', message, context);
    if (IS_PRODUCTION) {
      console.warn(JSON.stringify(entry));
    } else {
      console.warn(`\x1b[33m[WARN]\x1b[0m ${message}`, context || '');
    }
  }

  /**
   * Error: Falhas que precisam de atenção. Inclui stack trace.
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorInfo = error instanceof Error
      ? { error_message: error.message, stack: error.stack }
      : { error_message: String(error) };

    const entry = this.formatLog('error', message, {
      ...context,
      ...errorInfo,
    });

    if (IS_PRODUCTION) {
      console.error(JSON.stringify(entry));
      // TODO Fase 3: Sentry.captureException(error, { extra: context });
    } else {
      console.error(`\x1b[31m[ERROR]\x1b[0m ${message}`, {
        ...errorInfo,
        ...context,
      });
    }
  }

  /**
   * Helper: Cria sub-logger com contexto fixo (ex: módulo/route).
   */
  child(defaultContext: LogContext): ChildLogger {
    return new ChildLogger(this, defaultContext);
  }
}

class ChildLogger {
  constructor(
    private parent: Logger,
    private defaultContext: LogContext
  ) {}

  debug(message: string, context?: LogContext): void {
    this.parent.debug(message, { ...this.defaultContext, ...context });
  }

  info(message: string, context?: LogContext): void {
    this.parent.info(message, { ...this.defaultContext, ...context });
  }

  warn(message: string, context?: LogContext): void {
    this.parent.warn(message, { ...this.defaultContext, ...context });
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    this.parent.error(message, error, { ...this.defaultContext, ...context });
  }
}

/** Singleton — importar onde necessário */
export const logger = new Logger();
