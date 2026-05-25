type LogContext = Record<string, unknown>;

export const logger = {
  info(message: string, context?: LogContext) {
    console.info(`[info] ${message}`, context ?? {});
  },
  warn(message: string, context?: LogContext) {
    console.warn(`[warn] ${message}`, context ?? {});
  },
  error(message: string, context?: LogContext) {
    console.error(`[error] ${message}`, context ?? {});
  }
};
