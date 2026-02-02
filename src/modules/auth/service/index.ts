import { ServiceBootstrap } from '@bootstrap/ServiceBootstrap';
import { ILogger } from '@core/application/interfaces/ILogger'; // direct import for type
import { Container } from '@core/di/Container';
import { TOKENS } from '@core/di/tokens';

export class AuthService {
    async start() {
        const bootstrap = ServiceBootstrap.getInstance();
        await bootstrap.initialize('Auth Service');

        const container = Container.getInstance();
        const logger = container.resolve<ILogger>(TOKENS.Logger); // Cast because we registered instance roughly

        logger.info('Auth Service logic started. Listening for events...');

        // Here we would start consumers, workers, etc.
    }
}
