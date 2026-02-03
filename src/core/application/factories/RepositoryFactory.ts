import { DatabaseFacade } from '../facades/DatabaseFacade';
import { IUserRepository } from '@modules/auth/repositories/IUserRepository';
import { IAuthRepository } from '@modules/auth/repositories/IAuthRepository';
import { UserRepository } from '@modules/auth/repositories/UserRepository';
import { AuthRepository } from '@modules/auth/repositories/AuthRepository';
import { OrganizationRepository } from '@modules/organizations/repositories/OrganizationRepository';
import { OrganizationRoleRepository } from '@modules/organizations/repositories/OrganizationRoleRepository';
import { OrganizationMembersRepository } from '@modules/organizations/repositories/OrganizationMembersRepository';
import { UserPreferencesRepository } from '@modules/users/repositories/UserPreferencesRepository';
import { FeatureFlagRepository } from '@modules/feature-flags/repositories/FeatureFlagRepository';


export class RepositoryFactory {
    constructor(private db: DatabaseFacade) { }

    createUserRepository(): IUserRepository {
        return new UserRepository(this.db);
    }

    createAuthRepository(): IAuthRepository {
        return new AuthRepository(this.db);
    }

    createOrganizationRepository(): OrganizationRepository {
        return new OrganizationRepository(this.db);
    }

    createOrganizationRoleRepository(): OrganizationRoleRepository {
        return new OrganizationRoleRepository(this.db);
    }

    createOrganizationMembersRepository(): OrganizationMembersRepository {
        return new OrganizationMembersRepository(this.db);
    }

    createUserPreferencesRepository(): UserPreferencesRepository {
        return new UserPreferencesRepository(this.db);
    }

    createFeatureFlagRepository(): FeatureFlagRepository {
        return new FeatureFlagRepository(this.db);
    }
}
