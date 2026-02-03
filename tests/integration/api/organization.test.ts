import { describe, it, expect, beforeAll, jest } from '@jest/globals';
import request from 'supertest';
import { Container } from '../../../src/core/di/Container';
import { TOKENS } from '../../../src/core/di/tokens';
import { OrganizationService } from '../../../src/modules/organizations/services/OrganizationService';
import { OrganizationRequestRepository } from '../../../src/api/v1/modules/organizations/repositories/OrganizationRequestRepository';
import { OrganizationControllerFactory } from '../../../src/core/application/factories/OrganizationControllerFactory';
import { RepositoryFactory } from '../../../src/core/application/factories/RepositoryFactory';
import { IUserRepository } from '../../../src/modules/auth/repositories/IUserRepository';
import { AuthService } from '../../../src/modules/auth/services/AuthService';

// Mock Repository to bypass Kafka and call OrganizationService directly
class MockOrganizationRequestRepository extends OrganizationRequestRepository {
    constructor(private organizationService: OrganizationService) {
        super(false);
    }

    async list(userId: string) {
        try {
            const orgs = await this.organizationService.getUserOrganizations(userId);
            return orgs;
        } catch (err: any) {
            return { error: err.message, statusCode: err.statusCode || 400 };
        }
    }

    async update(orgId: string, userId: string, dto: any) {
        try {
            return await this.organizationService.update(orgId, userId, dto);
        } catch (err: any) {
            return { error: err.message, statusCode: err.statusCode || 400 };
        }
    }

    async getMembers(orgId: string, userId: string) {
        try {
            return await this.organizationService.getMembers(orgId, userId);
        } catch (err: any) {
            return { error: err.message, statusCode: err.statusCode || 400 };
        }
    }

    async inviteMember(orgId: string, userId: string, dto: any) {
        try {
            await this.organizationService.inviteMember(orgId, userId, dto);
            return { success: true };
        } catch (err: any) {
            return { error: err.message, statusCode: err.statusCode || 400 };
        }
    }

    async getRoles(orgId: string, userId: string) {
        try {
            return await this.organizationService.getRoles(orgId, userId);
        } catch (err: any) {
            return { error: err.message, statusCode: err.statusCode || 400 };
        }
    }
}

describe('Organization Integration Flow', () => {
    let app: any;
    let organizationService: OrganizationService;
    let authService: AuthService;
    let token: string;
    let userId: string;
    let orgId: string;

    beforeAll(async () => {
        const container = Container.getInstance();
        organizationService = container.resolve<OrganizationService>(TOKENS.OrganizationService);
        authService = container.resolve<AuthService>(TOKENS.AuthService);

        const mockRepo = new MockOrganizationRequestRepository(organizationService);

        // Mock the OrganizationControllerFactory to use our MockRepo
        const originalFactory = container.resolve<any>(TOKENS.OrganizationControllerFactory);
        const mockFactory = {
            create: () => originalFactory.create(mockRepo)
        };

        container.registerInstance(TOKENS.OrganizationControllerFactory, mockFactory);

        const { Server } = await import('../../../src/server/Server');
        const server = new Server();
        app = server.getApp();

        // Setup User and Token for authenticated requests
        const email = `org-test-${Date.now()}@example.com`;
        const password = 'password123';
        const regRes = await authService.register({ email, password, firstName: 'Org', lastName: 'Tester' });
        userId = regRes.user.id;

        // Auto-verify email for test
        const userRepo = container.resolve<RepositoryFactory>(TOKENS.RepositoryFactory).createUserRepository();
        const user = await userRepo.findById(userId);
        if (user) {
            user.verifyEmail();
            await userRepo.save(user);
        }

        const loginRes = await authService.login({ email, password });
        token = loginRes.token!;

        // Get the default organization created during registration
        const orgs = await organizationService.getUserOrganizations(userId);
        orgId = (orgs[0] as any).id;
    });

    it('should list organizations for user', async () => {
        const res = await request(app)
            .get('/api/v1/organizations')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0].id).toBe(orgId);
    });

    it('should update organization name', async () => {
        const newName = 'Updated Org Name';
        const res = await request(app)
            .put(`/api/v1/organizations/${orgId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: newName });

        if (res.status !== 200) console.log('Update Org Error:', res.body);
        expect(res.status).toBe(200);
        expect(res.body.name).toBe(newName);
    });

    it('should get organization members', async () => {
        const res = await request(app)
            .get(`/api/v1/organizations/${orgId}/members`)
            .set('Authorization', `Bearer ${token}`);

        if (res.status !== 200) console.log('Get Members Error:', res.body);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        // console.log('Members:', JSON.stringify(res.body, null, 2));
        // console.log('Target userId:', userId);
        expect(res.body.some((m: any) => m.userId === userId)).toBe(true);
    });

    it('should invite a member', async () => {
        // Create another user to invite
        const inviteeEmail = `invitee-${Date.now()}@example.com`;
        await authService.register({ email: inviteeEmail, password: 'password123', firstName: 'Invitee', lastName: 'User' });

        const res = await request(app)
            .post(`/api/v1/organizations/${orgId}/members/invite`)
            .set('Authorization', `Bearer ${token}`)
            .send({ email: inviteeEmail, roleName: 'Admin' });

        expect(res.status).toBe(200);

        // Verify member count increased
        const membersRes = await request(app)
            .get(`/api/v1/organizations/${orgId}/members`)
            .set('Authorization', `Bearer ${token}`);
        expect(membersRes.body.length).toBe(2);
    });

    it('should get organization roles', async () => {
        const res = await request(app)
            .get(`/api/v1/organizations/${orgId}/roles`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });
});
