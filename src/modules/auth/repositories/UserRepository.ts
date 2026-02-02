import { IUserRepository } from './IUserRepository';
import { User } from '../models/User';
import { BaseRepository } from '@api/shared/repositories/BaseRepository';
import { DatabaseFacade } from '@core/application/facades/DatabaseFacade';
import { Inject } from '@core/di/decorators/inject.decorator';
import { TOKENS } from '@core/di/tokens';
import { CreateUserQuery } from '../queries/user/CreateUserQuery';
import { UpdateUserQuery } from '../queries/user/UpdateUserQuery';
import { FindUserByEmailQuery } from '../queries/user/FindUserByEmailQuery';
import { FindUserByIdQuery } from '../queries/user/FindUserByIdQuery';

export class UserRepository extends BaseRepository<any> implements IUserRepository {
    constructor(@Inject(TOKENS.Database) db: DatabaseFacade) {
        super(db, 'users');
    }

    async save(user: User): Promise<void> {
        const exists = await this.findById(user.id);
        if (exists) {
            await new UpdateUserQuery(this.db).execute(user);
        } else {
            await new CreateUserQuery(this.db).execute(user);
        }
    }

    async findByEmail(email: string): Promise<User | null> {
        return new FindUserByEmailQuery(this.db).execute(email);
    }

    async findById(id: string): Promise<User | null> {
        return new FindUserByIdQuery(this.db).execute(id);
    }
}
