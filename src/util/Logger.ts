/**
 * Interface for logging. A subset of the Console object.
 */
export default interface Logger {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  log(message?: any, ...optionalParams: any[]): void;

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  debug(message?: any, ...optionalParams: any[]): void;

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  info(message?: any, ...optionalParams: any[]): void;

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  warn(message?: any, ...optionalParams: any[]): void;

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
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

  setLevel(level: Level): void {
    this.level = level;
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  debug(message?: any, ...optionalParams: any[]): void {
    if (this.level <= Level.DEBUG) {
      console.debug(this.getMessage(message), ...optionalParams);
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  log(message?: any, ...optionalParams: any[]): void {
    if (this.level <= Level.INFO) {
      console.log(this.getMessage(message), ...optionalParams);
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  info(message?: any, ...optionalParams: any[]): void {
    if (this.level <= Level.INFO) {
      console.info(this.getMessage(message), ...optionalParams);
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  warn(message?: any, ...optionalParams: any[]): void {
    if (this.level <= Level.WARN) {
      console.warn(this.getMessage(message), ...optionalParams);
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  error(message?: any, ...optionalParams: any[]): void {
    if (this.level <= Level.ERROR) {
      console.error(this.getMessage(message), ...optionalParams);
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  getMessage(message?: any): string {
    return this.name ? this.name + ': ' + message : message;
  }
}
