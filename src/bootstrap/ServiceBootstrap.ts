import { ConfigLoader } from '@core/config/ConfigLoader';
import { StructuredLogger } from '@core/monitoring/logging/StructuredLogger';
import { DatabaseFacade } from '@core/application/facades/DatabaseFacade';
import { MessagingFacade } from '@messaging/facades/MessagingFacade';
import { Container } from '@core/di/Container';
import { PostgresFactory } from '@database/factories/PostgresFactory';
import { KafkaMessageQueueFactory } from '@messaging/factories/KafkaMessageQueueFactory';
import { RepositoryFactory } from '@core/application/factories/RepositoryFactory';
import { ServiceFactory } from '@core/application/factories/ServiceFactory';
import { AuthControllerFactory } from '@core/application/factories/AuthControllerFactory';
import { UserControllerFactory } from '@core/application/factories/UserControllerFactory';
import { TOKENS } from '@core/di/tokens';

export class ServiceBootstrap {
    private static instance: ServiceBootstrap;
    private logger: StructuredLogger;
    private container: Container;

    private constructor() {
        this.logger = new StructuredLogger();
        this.container = Container.getInstance();
    }

    public static getInstance(): ServiceBootstrap {
        if (!ServiceBootstrap.instance) {
            ServiceBootstrap.instance = new ServiceBootstrap();
        }
        return ServiceBootstrap.instance;
    }

    public async initialize(serviceName: string): Promise<void> {
        try {
            this.logger.info(`Initializing ${serviceName}...`);

            // Load Config
            ConfigLoader.getInstance();

            // Register Core Facades in Container
            this.container.registerInstance(TOKENS.Config, ConfigLoader.getInstance());
            this.container.registerInstance(TOKENS.Logger, this.logger); // Use standard Logger interface if possible

            const dbFactory = new PostgresFactory();
            const dbFacade = new DatabaseFacade(dbFactory);
            this.container.registerInstance(TOKENS.Database, dbFacade);

            const msgFactory = new KafkaMessageQueueFactory();
            const msgFacade = new MessagingFacade(msgFactory);
            this.container.registerInstance(TOKENS.Messaging, msgFacade);

            // Register Application Factories
            const repoFactory = new RepositoryFactory(dbFacade);
            this.container.registerInstance(TOKENS.RepositoryFactory, repoFactory);

            const serviceFactory = new ServiceFactory(repoFactory);
            this.container.registerInstance(TOKENS.ServiceFactory, serviceFactory);

            const authControllerFactory = new AuthControllerFactory(serviceFactory);
            this.container.registerInstance(TOKENS.AuthControllerFactory, authControllerFactory);

            const userControllerFactory = new UserControllerFactory(serviceFactory);
            this.container.registerInstance(TOKENS.UserControllerFactory, userControllerFactory);

            // Connect Infrastructure
            // await dbFacade.connect(); // Optional based on service
            // await msgFacade.connect();

            this.logger.info(`${serviceName} initialized successfully.`);
        } catch (error: any) {
            this.logger.error(`Failed to initialize ${serviceName}`, error.stack);
            process.exit(1);
        }
    }
}
