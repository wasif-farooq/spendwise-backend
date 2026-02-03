import { RepositoryFactory } from './RepositoryFactory';
import { RedisFactory } from '@database/factories/RedisFactory';
import { AuthService } from '@modules/auth/services/AuthService';
import { UserService } from '@modules/users/services/UserService';
import { UserPreferencesService } from '@modules/users/services/UserPreferencesService';
import { FeatureFlagService } from '@modules/feature-flags/services/FeatureFlagService';
import { DatabaseFacade } from '@core/application/facades/DatabaseFacade';


export class ServiceFactory {
    private redisFactory = new RedisFactory();

    constructor(
        private repositoryFactory: RepositoryFactory,
        private db: DatabaseFacade
    ) { }

    createAuthService(): AuthService {
        const redisInfo = this.redisFactory.createClient();
        redisInfo.connect().catch(console.error); // Lazy connect

        return new AuthService(
            this.db,
            this.repositoryFactory.createUserRepository(),
            this.repositoryFactory.createAuthRepository(),
            this.repositoryFactory.createOrganizationRepository(),
            this.repositoryFactory.createOrganizationRoleRepository(),
            this.repositoryFactory.createOrganizationMembersRepository(),
            redisInfo
        );
    }

    createUserService(): UserService {
        return new UserService(
            this.repositoryFactory.createUserRepository()
        );
    }

    createOrganizationService(): import('../../../modules/organizations/services/OrganizationService').OrganizationService {
        return new (require('../../../modules/organizations/services/OrganizationService').OrganizationService)(
            this.repositoryFactory.createOrganizationRepository(),
            this.repositoryFactory.createOrganizationMembersRepository(),
            this.repositoryFactory.createOrganizationRoleRepository(),
            this.repositoryFactory.createUserRepository()
        );
    }

    createUserPreferencesService(): UserPreferencesService {
        return new UserPreferencesService(
            this.repositoryFactory.createUserPreferencesRepository()
        );
    }

    createFeatureFlagService(): FeatureFlagService {
        return new FeatureFlagService(
            this.repositoryFactory.createFeatureFlagRepository()
        );
    }
}

