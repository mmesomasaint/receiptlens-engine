type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private format(level: LogLevel, message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` | Context: ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  }

  public info(message: string, meta?: any) {
    console.log(this.format('info', message, meta));
  }

  public warn(message: string, meta?: any) {
    console.warn(this.format('warn', message, meta));
  }

  public error(message: string, meta?: any) {
    console.error(this.format('error', message, meta));
  }

  public debug(message: string, meta?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.format('debug', message, meta));
    }
  }
}

export const logger = new Logger();
