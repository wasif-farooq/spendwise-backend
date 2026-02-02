import { ILogger } from '@core/application/interfaces/ILogger';

export class LogStream {
    constructor(private logger: ILogger) { }

    write(message: string) {
        this.logger.info(message.trim());
    }
}
