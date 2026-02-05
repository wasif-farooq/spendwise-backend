import { Inject } from '@core/di/decorators/inject.decorator';
import { TOKENS } from '@core/di/tokens';
import { IUserRepository } from '../repositories/IUserRepository';
import { IAuthRepository } from '../repositories/IAuthRepository';
import { User } from '../models/User';
import { AuthIdentity } from '../models/AuthIdentity';
import { AppError } from '@core/api/utils/AppError';
import { LoginDto, RegisterDto } from '../dto/auth.dto';
import { Password } from '@api/shared/domain/value-objects/Password';
import { Email } from '@api/shared/domain/value-objects/Email';
import jwt from 'jsonwebtoken';
import { ConfigLoader } from '@core/config/ConfigLoader';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';


import { DatabaseFacade } from '@core/application/facades/DatabaseFacade';
import { OrganizationRepository } from '@modules/organizations/repositories/OrganizationRepository';
import { OrganizationRoleRepository } from '@modules/organizations/repositories/OrganizationRoleRepository';
import { OrganizationMembersRepository } from '@modules/organizations/repositories/OrganizationMembersRepository';
import { Organization } from '@modules/organizations/models/Organization';
import { OrganizationRole } from '@modules/organizations/models/OrganizationRole';
import { OrganizationMember } from '@modules/organizations/models/OrganizationMember';

export class AuthService {
    constructor(
        @Inject(TOKENS.Database) private db: DatabaseFacade,
        @Inject('UserRepository') private userRepo: IUserRepository,
        @Inject('AuthRepository') private authRepo: IAuthRepository,
        @Inject(TOKENS.OrganizationRepository) private organizationRepository: OrganizationRepository,
        @Inject(TOKENS.OrganizationRoleRepository) private organizationRoleRepository: OrganizationRoleRepository,
        @Inject(TOKENS.OrganizationMembersRepository) private organizationMembersRepository: OrganizationMembersRepository,
        // Optional Cache Injection (Manual for now in Factory)
        private cache?: any
    ) { }

    async getUserById(userId: string): Promise<User> {
        const user = await this.userRepo.findById(userId);
        if (!user) throw new AppError('User not found', 404);
        return user;
    }


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

        // Generate verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        user.setEmailVerificationCode(verificationCode);

        const identity = AuthIdentity.create({
            userId: user.id,
            provider: 'local',
            passwordHash: password.hash
        });

        // Transactional registration
        await this.db.transaction(async (trx) => {
            // 1. Save User
            await this.userRepo.save(user, { db: trx });
            await this.authRepo.save(identity, { db: trx });

            // 2. Create Organization "My Account"
            const organization = Organization.create({
                name: "My Account",
                slug: `my-account-${user.id.substring(0, 8)}`, // Simple slug generation
                ownerId: user.id
            });
            const trxOrg = await this.organizationRepository.create(organization, { db: trx });

            // 3. Create Role "Admin"
            const adminRole = OrganizationRole.create({
                name: "Admin",
                organizationId: trxOrg.id,
                permissions: ['*'],
                isSystem: true
            });
            const trxRole = await this.organizationRoleRepository.create(adminRole, { db: trx });

            // 4. Assign Role to User
            const member = OrganizationMember.create({
                userId: user.id,
                organizationId: trxOrg.id,
                roleIds: [trxRole.id]
            });
            await this.organizationMembersRepository.create(member, { db: trx });
        });

        // Mock Send Registration Email
        console.log(`[Mock Email] Registration verification code for ${user.email}: ${verificationCode}`);

        return { user };
    }

    async verifyEmail(emailStr: string, code: string): Promise<{ success: boolean; message: string }> {
        const email = Email.create(emailStr);
        const user = await this.userRepo.findByEmail(email.raw);
        if (!user) throw new AppError('User not found', 404);

        if (user.emailVerified) {
            throw new AppError('Email already verified', 400);
        }

        if (user.emailVerificationCode !== code) {
            throw new AppError('Invalid verification code', 400);
        }

        user.verifyEmail();
        await this.userRepo.save(user);

        return {
            success: true,
            message: 'Email verified successfully'
        };
    }

    async login(dto: LoginDto): Promise<{ token?: string; refreshToken?: string; user: User; requires2FA?: boolean; twoFactorMethods?: string[] }> {
        const email = Email.create(dto.email);

        const user = await this.userRepo.findByEmail(email.raw);
        if (!user) {
            throw new AppError('Invalid credentials', 401);
        }

        const identity = await this.authRepo.findByUserIdAndProvider(user.id, 'local');
        if (!identity || !identity.passwordHash) {
            throw new AppError('Invalid credentials', 401);
        }

        const password = Password.fromHash(identity.passwordHash);
        const valid = await password.compare(dto.password);

        if (!valid) {
            throw new AppError('Invalid credentials', 401);
        }

        // 2FA Check
        if (user.twoFactorEnabled) {
            return {
                user,
                requires2FA: true,
                twoFactorMethods: user.twoFactorMethod ? [user.twoFactorMethod] : []
            };
        }

        // Generate Tokens
        const token = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);

        identity.updateLastLogin();
        await this.authRepo.save(identity);

        return { token, refreshToken, user };
    }

    async verify2FA(userId: string, code: string, method?: string): Promise<{ token: string; refreshToken: string; user: User }> {
        const user = await this.userRepo.findById(userId);
        if (!user) throw new AppError('User not found', 404);

        if (!user.twoFactorEnabled || !user.twoFactorSecret) {
            throw new AppError('2FA not enabled', 400);
        }

        const isValid = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: code
        });

        if (!isValid) throw new AppError('Invalid code', 400);

        const token = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);
        return { token, refreshToken, user };
    }


    async resend2FA(userId: string, method: string): Promise<void> {
        const user = await this.userRepo.findById(userId);
        if (!user) throw new AppError('User not found', 404);

        if (method === 'app') {
            // Nothing to "resend" for app method usually, user just opens app.
            // But we can check if it's set up.
            if (!user.twoFactorEnabled) throw new AppError('2FA not enabled', 400);
            return;
        }

        // For SMS/Email:
        // 1. Generate new code
        // 2. Store in cache
        // 3. Send via provider
        console.log(`[Mock] Resending 2FA code to ${user.email} via ${method}`);
    }


    async verifyBackupCode(userId: string, code: string): Promise<{ token: string; refreshToken: string; user: User }> {
        const user = await this.userRepo.findById(userId);
        if (!user) throw new AppError('User not found', 404);

        if (!user.backupCodes.includes(code)) {
            throw new AppError('Invalid backup code', 400);
        }

        // Requirement: "if user use this method then disable his all 2fa methods"
        user.disable2FA();
        await this.userRepo.save(user);

        const token = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);
        return { token, refreshToken, user };
    }

    async refreshToken(token: string): Promise<{ token: string }> {
        const config = ConfigLoader.getInstance();
        const secret = config.get('auth.jwt.secret');

        try {
            const payload = jwt.verify(token, secret) as any;

            // In a real app, you might want to check a whitelist/database for the refresh token
            // or use a different secret for refresh tokens.

            const user = await this.userRepo.findById(payload.userId);
            if (!user) throw new AppError('User not found', 404);

            const newAccessToken = this.generateAccessToken(user);
            return { token: newAccessToken };
        } catch (err) {
            throw new AppError('Invalid refresh token', 401);
        }
    }

    private generateAccessToken(user: User): string {
        const config = ConfigLoader.getInstance();
        const secret = config.get('auth.jwt.secret');
        return jwt.sign(
            { userId: user.id, email: user.email },
            secret,
            { expiresIn: config.get('auth.jwt.accessTokenExpiry') }
        );
    }

    private generateRefreshToken(user: User): string {
        const config = ConfigLoader.getInstance();
        const secret = config.get('auth.jwt.secret');
        return jwt.sign(
            { userId: user.id, purpose: 'refresh' },
            secret,
            { expiresIn: config.get('auth.jwt.refreshTokenExpiry') }
        );
    }

    async forgotPassword(emailStr: string): Promise<void> {
        const email = Email.create(emailStr);
        const user = await this.userRepo.findByEmail(email.raw);
        if (!user) {
            // Silently fail to prevent enumeration
            return;
        }

        // Generate Code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Cache Code (TTL 15m)
        if (this.cache) {
            await this.cache.set(`reset_code:${email.raw}`, code, { EX: 900 });
        } else {
            console.log("CACHE NOT CONFIGURED, CANNOT STORE RESET CODE");
        }

        // Mock Send Email
        console.log(`[Mock Email] Password reset code for ${email.raw}: ${code}`);
    }

    async verifyResetCode(emailStr: string, code: string): Promise<{ resetToken: string }> {
        const email = Email.create(emailStr);

        let validCode = false;
        if (this.cache) {
            const storedCode = await this.cache.get(`reset_code:${email.raw}`);
            if (storedCode === code) {
                validCode = true;
                // Invalidate code used
                await this.cache.del(`reset_code:${email.raw}`);
            }
        }

        if (!validCode) {
            throw new AppError('Invalid or expired reset code', 400);
        }


        const user = await this.userRepo.findByEmail(email.raw);
        if (!user) throw new AppError('User not found', 404);

        // Generate Reset Token (Short lived, specific purpose)
        const config = ConfigLoader.getInstance();
        const secret = config.get('auth.jwt.secret');
        const resetToken = jwt.sign(
            { sub: user.id, purpose: 'password_reset' },
            secret,
            { expiresIn: '15m' }
        );

        return { resetToken };
    }

    async resetPassword(token: string, newPassword: string): Promise<void> {
        // Verify Token
        const config = ConfigLoader.getInstance();
        const secret = config.get('auth.jwt.secret');

        let payload: any;
        try {
            payload = jwt.verify(token, secret);
        } catch (err) {
            throw new AppError('Invalid or expired reset token', 400);
        }

        if (payload.purpose !== 'password_reset') {
            throw new AppError('Invalid token purpose', 400);
        }

        const userId = payload.sub;
        const identity = await this.authRepo.findByUserIdAndProvider(userId, 'local');
        if (!identity) {
            throw new AppError('User identity not found', 404);
        }

        // Updates
        const password = await Password.create(newPassword);
        identity.changePassword(password.hash);

        await this.authRepo.save(identity);
    }

    async changePassword(userId: string, oldPass: string, newPass: string): Promise<void> {
        const identity = await this.authRepo.findByUserIdAndProvider(userId, 'local');
        if (!identity || !identity.passwordHash) {
            throw new AppError('User not found', 404);
        }

        const currentPassword = Password.fromHash(identity.passwordHash);
        const valid = await currentPassword.compare(oldPass);
        if (!valid) {
            throw new AppError('Incorrect current password', 400);
        }

        const newPassword = await Password.create(newPass);
        identity.changePassword(newPassword.hash);
        await this.authRepo.save(identity);
    }

    async generate2FASecret(userId: string): Promise<{ secret: string; backupCodes: string[]; qrCode: string }> {
        const user = await this.userRepo.findById(userId);
        if (!user) throw new AppError('User not found', 404);

        const secret = speakeasy.generateSecret({
            name: `SpendWise:${user.email}`,
            issuer: 'SpendWise'
        });

        const backupCodes = Array.from({ length: 8 }, () =>
            Math.floor(10000000 + Math.random() * 90000000).toString()
        );

        // Generate QR code data URL
        const qrCode = await QRCode.toDataURL(secret.otpauth_url || '');

        // Cache the secret and backup codes temporarily for verification step
        if (this.cache) {
            await this.cache.set(`2fa_pending:${userId}`, JSON.stringify({
                secret: secret.base32,
                backupCodes
            }), { EX: 600 });
        }

        return {
            secret: secret.base32,
            backupCodes,
            qrCode
        };
    }

    async enable2FA(userId: string, code: string): Promise<void> {
        let pending: any = null;
        if (this.cache) {
            const data = await this.cache.get(`2fa_pending:${userId}`);
            if (data) pending = JSON.parse(data);
        }

        if (!pending) {
            throw new AppError('2FA setup session expired or not found', 400);
        }

        const isValid = speakeasy.totp.verify({
            secret: pending.secret,
            encoding: 'base32',
            token: code
        });

        if (!isValid) throw new AppError('Invalid code', 400);

        const user = await this.userRepo.findById(userId);
        if (!user) throw new AppError('User not found', 404);

        // Enable 2FA
        user.enable2FA('app', pending.secret, pending.backupCodes);
        await this.userRepo.save(user);

        // Clear cache
        if (this.cache) {
            await this.cache.del(`2fa_pending:${userId}`);
        }
    }


    async disable2FA(userId: string): Promise<void> {
        const user = await this.userRepo.findById(userId);
        if (!user) throw new AppError('User not found', 404);

        user.disable2FA();
        await this.userRepo.save(user);
    }
}
