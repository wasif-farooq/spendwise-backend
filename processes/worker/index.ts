import { ServiceBootstrap } from '../../src/bootstrap/ServiceBootstrap';
import { Kafka } from 'kafkajs';
import { ConfigLoader } from '@core/config/ConfigLoader';
import { TOKENS } from '@core/di/tokens';
import { Container } from '@core/di/Container';
import { AuthService } from '@modules/auth/services/AuthService';
import { UserService } from '@modules/users/services/UserService';
import { OrganizationService } from '@modules/organizations/services/OrganizationService';
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
    const organizationService = serviceFactory.createOrganizationService() as OrganizationService;

    console.log('Unified Worker Listening...');

    // Subscribe to Auth Topics
    await consumer.subscribe({ topic: 'auth.service.login', fromBeginning: false });
    await consumer.subscribe({ topic: 'auth.service.register', fromBeginning: false });
    await consumer.subscribe({ topic: 'auth.service.verify-2fa', fromBeginning: false });
    await consumer.subscribe({ topic: 'auth.service.resend-2fa', fromBeginning: false });
    await consumer.subscribe({ topic: 'auth.service.verify-backup-code', fromBeginning: false });
    await consumer.subscribe({ topic: 'auth.service.forgot-password', fromBeginning: false });
    await consumer.subscribe({ topic: 'auth.service.verify-reset-code', fromBeginning: false });
    await consumer.subscribe({ topic: 'auth.service.reset-password', fromBeginning: false });

    // Subscribe to User Topics
    await consumer.subscribe({ topic: 'user.service.getProfile', fromBeginning: false });
    await consumer.subscribe({ topic: 'user.service.updateProfile', fromBeginning: false });

    // Subscribe to Organization Topics
    await consumer.subscribe({ topic: 'organization.service.update', fromBeginning: false });
    await consumer.subscribe({ topic: 'organization.service.delete', fromBeginning: false });
    await consumer.subscribe({ topic: 'organization.service.list', fromBeginning: false });
    await consumer.subscribe({ topic: 'organization.service.get-members', fromBeginning: false });
    await consumer.subscribe({ topic: 'organization.service.invite-member', fromBeginning: false });
    await consumer.subscribe({ topic: 'organization.service.remove-member', fromBeginning: false });
    await consumer.subscribe({ topic: 'organization.service.get-roles', fromBeginning: false });
    await consumer.subscribe({ topic: 'organization.service.update-role', fromBeginning: false });
    await consumer.subscribe({ topic: 'organization.service.assign-role', fromBeginning: false });
    await consumer.subscribe({ topic: 'organization.service.delete-role', fromBeginning: false });

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
                } else if (topic === 'auth.service.verify-2fa') {
                    console.log(`[Auth] Processing Verify 2FA for ${correlationId}`);
                    // Note: verify2FA expects (userId, code, method)
                    result = await authService.verify2FA(payload.userId, payload.code, payload.method);
                } else if (topic === 'auth.service.resend-2fa') {
                    console.log(`[Auth] Processing Resend 2FA for ${correlationId}`);
                    result = await authService.resend2FA(payload.userId, payload.method);
                } else if (topic === 'auth.service.verify-backup-code') {
                    console.log(`[Auth] Processing Verify Backup Code for ${correlationId}`);
                    result = await authService.verifyBackupCode(payload.userId, payload.code);
                } else if (topic === 'auth.service.forgot-password') {
                    console.log(`[Auth] Processing Forgot Password for ${correlationId}`);
                    result = await authService.forgotPassword(payload.email);
                } else if (topic === 'auth.service.verify-reset-code') {
                    console.log(`[Auth] Processing Verify Reset Code for ${correlationId}`);
                    result = await authService.verifyResetCode(payload.email, payload.code);
                } else if (topic === 'auth.service.reset-password') {
                    console.log(`[Auth] Processing Reset Password for ${correlationId}`);
                    result = await authService.resetPassword(payload.token, payload.newPassword);
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

                // --- Organization Handling ---
                else if (topic === 'organization.service.update') {
                    console.log(`[Org] Processing Update for ${correlationId}`);
                    result = await organizationService.update(payload.orgId, payload.userId, payload);
                } else if (topic === 'organization.service.delete') {
                    console.log(`[Org] Processing Delete for ${correlationId}`);
                    result = await organizationService.delete(payload.orgId, payload.userId);
                } else if (topic === 'organization.service.list') {
                    console.log(`[Org] Processing List for ${correlationId}`);
                    result = await organizationService.getUserOrganizations(payload.userId);
                } else if (topic === 'organization.service.get-members') {
                    console.log(`[Org] Processing GetMembers for ${correlationId}`);
                    result = await organizationService.getMembers(payload.orgId, payload.userId);
                } else if (topic === 'organization.service.invite-member') {
                    console.log(`[Org] Processing InviteMember for ${correlationId}`);
                    result = await organizationService.inviteMember(payload.orgId, payload.userId, payload);
                } else if (topic === 'organization.service.remove-member') {
                    console.log(`[Org] Processing RemoveMember for ${correlationId}`);
                    result = await organizationService.removeMember(payload.orgId, payload.userId, payload.memberId);
                } else if (topic === 'organization.service.get-roles') {
                    console.log(`[Org] Processing GetRoles for ${correlationId}`);
                    result = await organizationService.getRoles(payload.orgId, payload.userId);
                } else if (topic === 'organization.service.update-role') {
                    console.log(`[Org] Processing UpdateRole for ${correlationId}`);
                    result = await organizationService.updateRole(payload.orgId, payload.userId, payload.roleId, payload.permissions);
                } else if (topic === 'organization.service.assign-role') {
                    console.log(`[Org] Processing AssignRole for ${correlationId}`);
                    result = await organizationService.assignRole(payload.orgId, payload.userId, payload.memberId, payload.roleId);
                } else if (topic === 'organization.service.delete-role') {
                    console.log(`[Org] Processing DeleteRole for ${correlationId}`);
                    result = await organizationService.deleteRole(payload.orgId, payload.userId, payload.roleId);
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
