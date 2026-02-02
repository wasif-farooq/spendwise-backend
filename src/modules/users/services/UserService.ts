import { Inject } from '@core/di/decorators/inject.decorator';
import { TOKENS } from '@core/di/tokens';
import { IUserRepository } from '../../auth/repositories/IUserRepository';
import { User } from '../../auth/models/User';

export class UserService {
    constructor(
        @Inject('UserRepository') private userRepo: IUserRepository
    ) { }

    async getProfile(userId: string): Promise<User> {
        const user = await this.userRepo.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }

    async updateProfile(userId: string, data: { firstName: string; lastName: string }): Promise<User> {
        const user = await this.userRepo.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        user.updateName(data.firstName, data.lastName);
        await this.userRepo.save(user);

        return user;
    }
}
