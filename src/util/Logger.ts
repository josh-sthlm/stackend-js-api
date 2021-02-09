/**
 * Interface for logging. A subset of the Console object.
 */
export default interface Logger {
  log(message?: any, ...optionalParams: any[]): void;
  debug(message?: any, ...optionalParams: any[]): void;
  info(message?: any, ...optionalParams: any[]): void;
  warn(message?: any, ...optionalParams: any[]): void;
  error(message?: any, ...optionalParams: any[]): void;
}

/**
 * Log levels for the ConsoleLogger
 */
export enum Level {
  DEBUG,
  INFO,
  WARN,
  ERROR
}

/**
 * Simple logger that uses the console object.
 */
export class ConsoleLogger implements Logger {
  name: string;
  level: Level = Level.WARN;

  constructor(name: string, level?: Level) {
    this.name = name;
    if (typeof level !== 'undefined') {
      this.level = level;
    }
  }

  setLevel(level: Level) {
    this.level = level;
  }

  debug(message?: any, ...optionalParams: any[]): void {
    if (this.level <= Level.DEBUG) {
      console.debug(this.getMessage(message), ...optionalParams);
    }
  }

  log(message?: any, ...optionalParams: any[]): void {
    if (this.level <= Level.INFO) {
      console.log(this.getMessage(message), ...optionalParams);
    }
  }

  info(message?: any, ...optionalParams: any[]): void {
    if (this.level <= Level.INFO) {
      console.info(this.getMessage(message), ...optionalParams);
    }
  }

  warn(message?: any, ...optionalParams: any[]): void {
    if (this.level <= Level.WARN) {
      console.warn(this.getMessage(message), ...optionalParams);
    }
  }

  error(message?: any, ...optionalParams: any[]): void {
    if (this.level <= Level.ERROR) {
      console.error(this.getMessage(message), ...optionalParams);
    }
  }

  getMessage(message?: any): string {
    return this.name ? this.name + ': ' + message : message;
  }
}
