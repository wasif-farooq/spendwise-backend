import { DatabaseFacade } from '../facades/DatabaseFacade';
import { IUserRepository } from '@modules/auth/repositories/IUserRepository';
import { IAuthRepository } from '@modules/auth/repositories/IAuthRepository';
import { UserRepository } from '@modules/auth/repositories/UserRepository';
import { AuthRepository } from '@modules/auth/repositories/AuthRepository';

export class RepositoryFactory {
    constructor(private db: DatabaseFacade) { }

    createUserRepository(): IUserRepository {
        return new UserRepository(this.db);
    }

    createAuthRepository(): IAuthRepository {
        return new AuthRepository(this.db);
    }
}
