type LogMeta = Record<string, any>;

class StructuredLogger {
  private format(level: "INFO" | "WARN" | "ERROR" | "DEBUG", message: string, meta?: LogMeta) {
    const logObject = {
      timestamp: new Date().toISOString(),
      level,
      message,
      env: process.env.NODE_ENV,
      ...meta,
    };

    return JSON.stringify(logObject);
  }

  public info(message: string, meta?: LogMeta) {
    console.log(this.format("INFO", message, meta));
  }

  public warn(message: string, meta?: LogMeta) {
    console.warn(this.format("WARN", message, meta));
  }

  public error(message: string, error?: any, meta?: LogMeta) {
    const errorDetails = error
      ? {
          error_message: error.message || String(error),
          error_stack: error.stack,
          ...meta,
        }
      : meta;

    console.error(this.format("ERROR", message, errorDetails));
  }

  public debug(message: string, meta?: LogMeta) {
    if (process.env.NODE_ENV !== "production") {
      console.log(this.format("DEBUG", message, meta));
    }
  }
}

export const logger = new StructuredLogger();
export default logger;
