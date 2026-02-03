import { ServiceBootstrap } from '../../src/bootstrap/ServiceBootstrap';
import { Kafka } from 'kafkajs';
import { ConfigLoader } from '@core/config/ConfigLoader';
import { TOKENS } from '@core/di/tokens';
import { Container } from '@core/di/Container';
import { AuthService } from '@modules/auth/services/AuthService';
import { UserService } from '@modules/users/services/UserService';
import { AppError } from '@core/api/utils/AppError';

// Consolidate Worker Logic
const startWorker = async () => {
    const bootstrap = ServiceBootstrap.getInstance();
    await bootstrap.initialize('Unified Worker');

    const config = ConfigLoader.getInstance();
    const kafkaConfig = config.get('messaging.kafka');

    const kafka = new Kafka({
        clientId: 'backend-worker',
        brokers: kafkaConfig.brokers,
    });

    const consumer = kafka.consumer({ groupId: 'backend-service-group' }); // Unified Group
    const producer = kafka.producer();

    await consumer.connect();
    await producer.connect();

    const container = Container.getInstance();
    const serviceFactory = container.resolve<any>(TOKENS.ServiceFactory);

    // Resolve Services
    const authService = serviceFactory.createAuthService() as AuthService;
    const userService = serviceFactory.createUserService() as UserService;

    console.log('Unified Worker Listening...');

    // Subscribe to Auth Topics
    await consumer.subscribe({ topic: 'auth.service.login', fromBeginning: false });
    await consumer.subscribe({ topic: 'auth.service.register', fromBeginning: false });

    // Subscribe to User Topics
    await consumer.subscribe({ topic: 'user.service.getProfile', fromBeginning: false });
    await consumer.subscribe({ topic: 'user.service.updateProfile', fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const replyTo = message.headers?.replyTo?.toString();
            const correlationId = message.headers?.correlationId?.toString();

            if (!replyTo || !correlationId) return;

            try {
                const payload = JSON.parse(message.value?.toString() || '{}');
                let result;

                // --- Auth Handling ---
                if (topic === 'auth.service.login') {
                    console.log(`[Auth] Processing Login for ${correlationId}`);
                    result = await authService.login(payload);
                } else if (topic === 'auth.service.register') {
                    console.log(`[Auth] Processing Register for ${correlationId}`);
                    result = await authService.register(payload);
                }

                // --- User Handling ---
                else if (topic === 'user.service.getProfile') {
                    console.log(`[User] Processing GetProfile for ${correlationId}`);
                    result = await userService.getProfile(payload.userId);
                } else if (topic === 'user.service.updateProfile') {
                    console.log(`[User] Processing UpdateProfile for ${correlationId}`);
                    const { userId, ...data } = payload;
                    result = await userService.updateProfile(userId, data);
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
                console.error(`Error processing RPC [${topic}]`, error);

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
