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
 * Simple logger that uses the console
 */
export class ConsoleLogger implements Logger {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  log(message?: any, ...optionalParams: any[]): void {
    console.log(this.getMessage(message), ...optionalParams);
  }

  debug(message?: any, ...optionalParams: any[]): void {
    console.debug(this.getMessage(message), ...optionalParams);
  }

  info(message?: any, ...optionalParams: any[]): void {
    console.info(this.getMessage(message), ...optionalParams);
  }

  warn(message?: any, ...optionalParams: any[]): void {
    console.warn(this.getMessage(message), ...optionalParams);
  }

  error(message?: any, ...optionalParams: any[]): void {
    console.error(this.getMessage(message), ...optionalParams);
  }

  getMessage(message?: any): string {
    return this.name ? this.name + ': ' + message : message;
  }
}
