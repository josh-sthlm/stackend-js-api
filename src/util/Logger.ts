/**
 * Interface for logging. A subset of the Console object.
 */
export default interface Logger {
  debug(...data: any[]): void;
  error(...data: any[]): void;
  info(...data: any[]): void;
  warn(...data: any[]): void;
}

/**
 * Simple logger that uses the console
 */
export class ConsoleLogger implements Logger {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  debug(...data: any[]): void {
    console.debug(this.fmt(data));
  }

  info(...data: any[]): void {
    console.info(this.fmt(data));
  }

  warn(...data: any[]): void {
    console.warn(this.fmt(data));
  }

  error(...data: any[]): void {
    console.error(this.fmt(data));
  }

  fmt(...data: any[]): any[] {
    return [this.name, ...data];
  }
}
