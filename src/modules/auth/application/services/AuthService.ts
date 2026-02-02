import { Inject } from '@core/di/decorators/inject.decorator';
import { TOKENS } from '@core/di/tokens';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { User } from '../../domain/models/User';
import { AuthIdentity } from '../../domain/models/AuthIdentity';
import { AppError } from '@core/api/utils/AppError';
import { LoginDto, RegisterDto } from '../dto/auth.dto';
import { Password } from '@api/shared/domain/value-objects/Password';
import { Email } from '@api/shared/domain/value-objects/Email';
import jwt from 'jsonwebtoken';
import { ConfigLoader } from '@core/config/ConfigLoader';

export class AuthService {
    constructor(
        @Inject('UserRepository') private userRepo: IUserRepository,
        @Inject('AuthRepository') private authRepo: IAuthRepository,
        // Optional Cache Injection (Manual for now in Factory)
        private cache?: any
    ) { }

    async register(dto: RegisterDto): Promise<{ user: User }> {
        const email = Email.create(dto.email);

        const existingUser = await this.userRepo.findByEmail(email.raw);
        if (existingUser) {
            throw new AppError('User already exists', 409);
        }

        const user = User.create({
            email: email.raw,
            firstName: dto.firstName,
            lastName: dto.lastName
        });

        const password = await Password.create(dto.password);

        const identity = AuthIdentity.create({
            userId: user.id,
            provider: 'local',
            passwordHash: password.hash
        });

        // Transactional consistency is ideal here (Unit of Work)
        // For now, sequential saves.
        await this.userRepo.save(user);
        await this.authRepo.save(identity);

        return { user };
    }

    async login(dto: LoginDto): Promise<{ token: string; user: User }> {
        const email = Email.create(dto.email);

        // Cache Check (User Lookup)
        let user: User | null = null;
        if (this.cache) {
            const cachedUser = await this.cache.get(`user:${email.raw}`);
            if (cachedUser) {
                // Deserialize... (Skipping full Hydration logic for brevity, assuming simple obj)
                // This is just to demonstrate the flow requested.
                // Ideally we hydrate Entity.
            }
        }

        if (!user) {
            user = await this.userRepo.findByEmail(email.raw);
            // Set Cache
            if (user && this.cache) {
                await this.cache.set(`user:${email.raw}`, JSON.stringify(user.getProps()), { EX: 3600 });
            }
        }

        if (!user) {
            throw new AppError('Invalid credentials', 401);
        }

        const identity = await this.authRepo.findByUserIdAndProvider(user.id, 'local');
        if (!identity || !identity.passwordHash) {
            throw new AppError('Invalid credentials', 401); // Or provider mismatch
        }

        const password = Password.fromHash(identity.passwordHash);
        const valid = await password.compare(dto.password);

        if (!valid) {
            throw new AppError('Invalid credentials', 401);
        }

        // Generate Token
        const config = ConfigLoader.getInstance();
        const secret = config.get('auth.jwt.secret');
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            secret,
            { expiresIn: config.get('auth.jwt.accessTokenExpiry') }
        );

        identity.updateLastLogin();
        await this.authRepo.save(identity);

        return { token, user };
    }
}
