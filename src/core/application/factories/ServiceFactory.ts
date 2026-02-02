import { RepositoryFactory } from './RepositoryFactory';
import { RedisFactory } from '@database/factories/RedisFactory';
import { AuthService } from '@modules/auth/services/AuthService';
import { UserService } from '@modules/users/services/UserService';

export class ServiceFactory {
    private redisFactory = new RedisFactory();

    constructor(private repositoryFactory: RepositoryFactory) { }

    createAuthService(): AuthService {
        const redisInfo = this.redisFactory.createClient();
        redisInfo.connect().catch(console.error); // Lazy connect

        return new AuthService(
            this.repositoryFactory.createUserRepository(),
            this.repositoryFactory.createAuthRepository(),
            redisInfo
        );
    }

    createUserService(): UserService {
        return new UserService(
            this.repositoryFactory.createUserRepository()
        );
    }
}
