/**
 * Centralized logging utility
 * Provides structured logging that can be easily integrated with services like Sentry
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Log debug information (development only)
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(`🔍 ${message}`, context || '');
    }
  }

  /**
   * Log informational messages
   */
  info(message: string, context?: LogContext) {
    if (!this.isProduction) {
      console.log(`ℹ️  ${message}`, context || '');
    }
  }

  /**
   * Log warnings
   */
  warn(message: string, context?: LogContext) {
    console.warn(`⚠️  ${message}`, context || '');
  }

  /**
   * Log errors
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    console.error(`❌ ${message}`, {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
      ...context,
    });

    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    // if (this.isProduction) {
    //   Sentry.captureException(error, { extra: context });
    // }
  }

  /**
   * Log successful operations
   */
  success(message: string, context?: LogContext) {
    if (!this.isProduction) {
      console.log(`✅ ${message}`, context || '');
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience methods
export const { debug, info, warn, error, success } = logger;
