import { LoggerInterface } from './interfaces/logger.interface';

export class LogService {
    private static logger: LoggerInterface = console;

    public static error(message?: any, ...optionalParams: any[]) {
        this.logger.error(message, optionalParams);
    }

    public static warn(message?: any, ...optionalParams: any[]) {
        this.logger.warn(message, optionalParams);
    }

    public static info(message?: any, ...optionalParams: any[]) {
        this.logger.info(message, optionalParams);
    }

    public static debug(message?: any, ...optionalParams: any[]) {
        this.logger.debug(message, optionalParams);
    }

    public static setLogger(logger: LoggerInterface) {
        this.logger = logger;
    }
}
