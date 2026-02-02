import { ServiceBootstrap } from '@bootstrap/ServiceBootstrap';
import { Container } from '@core/di/Container';
import { TOKENS } from '@core/di/tokens';
import { ILogger } from '@core/application/interfaces/ILogger';

export class UserService {
    async start() {
        const bootstrap = ServiceBootstrap.getInstance();
        await bootstrap.initialize('User Service');

        const container = Container.getInstance();
        const logger = container.resolve<ILogger>(TOKENS.Logger);

        logger.info('User Service logic started. Listening for events...');
    }
}
