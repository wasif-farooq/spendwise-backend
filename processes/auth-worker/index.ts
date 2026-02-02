import { ServiceBootstrap } from '../../src/bootstrap/ServiceBootstrap';
import { Kafka } from 'kafkajs';
import { ConfigLoader } from '@core/config/ConfigLoader';
import { TOKENS } from '@core/di/tokens';
import { AuthService } from '@modules/auth/application/services/AuthService';
import { Container } from '@core/di/Container';
import { AppError } from '@core/api/utils/AppError';

// Quick implementation of the Worker logic
const startWorker = async () => {
    const bootstrap = ServiceBootstrap.getInstance();
    await bootstrap.initialize('Auth Worker'); // Inits DB, Factories, etc.

    const config = ConfigLoader.getInstance();
    const kafkaConfig = config.get('messaging.kafka');

    const kafka = new Kafka({
        clientId: 'auth-worker',
        brokers: kafkaConfig.brokers,
    });

    const consumer = kafka.consumer({ groupId: 'auth-service-group' });
    const producer = kafka.producer();

    await consumer.connect();
    await producer.connect();

    const container = Container.getInstance();
    // We need to resolve AuthService manually since we are outside the ControllerFactory
    // But ServiceFactory is registered in Bootstrap.
    // Let's get it from ServiceFactory
    const serviceFactory = container.resolve<any>(TOKENS.ServiceFactory);
    const authService = serviceFactory.createAuthService() as AuthService;

    console.log('Auth Worker Listening...');

    await consumer.subscribe({ topic: 'auth.service.login', fromBeginning: false });
    await consumer.subscribe({ topic: 'auth.service.register', fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const replyTo = message.headers?.replyTo?.toString();
            const correlationId = message.headers?.correlationId?.toString();

            if (!replyTo || !correlationId) return; // Fire & Forget or invalid RPC

            try {
                const payload = JSON.parse(message.value?.toString() || '{}');
                let result;

                if (topic === 'auth.service.login') {
                    console.log(`Processing Login for ${correlationId}`);
                    result = await authService.login(payload);
                } else if (topic === 'auth.service.register') {
                    console.log(`Processing Register for ${correlationId}`);
                    result = await authService.register(payload);
                }

                // Reply Success
                await producer.send({
                    topic: replyTo,
                    messages: [{
                        value: JSON.stringify(result),
                        headers: { correlationId }
                    }]
                });

            } catch (error: any) {
                console.error('Error processing RPC', error);

                // Reply Error
                const errorResponse = {
                    error: error.message || 'Internal Error',
                    statusCode: (error instanceof AppError) ? error.statusCode : 500
                };

                await producer.send({
                    topic: replyTo,
                    messages: [{
                        value: JSON.stringify(errorResponse),
                        headers: { correlationId }
                    }]
                });
            }
        },
    });
};

startWorker().catch(console.error);
