import { DatabaseFacade } from '../facades/DatabaseFacade';
import { IUserRepository } from '@modules/auth/domain/repositories/IUserRepository';
import { IAuthRepository } from '@modules/auth/domain/repositories/IAuthRepository';
import { UserRepository } from '@modules/auth/application/infrastructure/repositories/UserRepository';
import { AuthRepository } from '@modules/auth/application/infrastructure/repositories/AuthRepository';

export class RepositoryFactory {
    constructor(private db: DatabaseFacade) { }

    createUserRepository(): IUserRepository {
        return new UserRepository(this.db);
    }

    createAuthRepository(): IAuthRepository {
        return new AuthRepository(this.db);
    }
}
