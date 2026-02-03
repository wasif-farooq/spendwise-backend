import { NextFunction, Request, Response } from 'express';
import { Inject } from '@core/di/decorators/inject.decorator';
import { UserPreferencesService } from '@modules/users/services/UserPreferencesService';
import { AuthService } from '@modules/auth/services/AuthService';
import { UpdateUserPreferencesSchema } from '@modules/users/dto/user-preferences.dto';
import { ChangePasswordSchema, Enable2FASchema } from '@modules/auth/dto/auth.dto';
import { AppError } from '@core/api/utils/AppError';


export class SettingsController {
    constructor(
        @Inject('UserPreferencesService') private userPreferencesService: UserPreferencesService,
        @Inject('AuthService') private authService: AuthService
    ) { }

    async getPreferences(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.userId || (req as any).user.sub || (req as any).user.id; // handle different jwt payloads
            const preferences = await this.userPreferencesService.getPreferences(userId);
            res.json({ data: preferences.toDTO() });
        } catch (error) {
            next(error);
        }
    }

    async updatePreferences(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = UpdateUserPreferencesSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError('Invalid input: ' + JSON.stringify(validation.error.format()), 400);

            }

            const userId = (req as any).user.userId || (req as any).user.sub || (req as any).user.id;
            const preferences = await this.userPreferencesService.updatePreferences(userId, validation.data);
            res.json({ data: preferences.toDTO() });
        } catch (error) {
            next(error);
        }
    }

    async getSecuritySettings(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.userId || (req as any).user.sub || (req as any).user.id;
            const user = await (this.authService as any).getUserById(userId);

            res.json({
                data: {
                    twoFactorEnabled: user.twoFactorEnabled || false,
                    twoFactorMethod: user.twoFactorMethod,
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async changePassword(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = ChangePasswordSchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError('Invalid input: ' + JSON.stringify(validation.error.format()), 400);
            }

            const userId = (req as any).user.userId || (req as any).user.sub || (req as any).user.id;
            await this.authService.changePassword(userId, validation.data.oldPassword, validation.data.newPassword);

            res.json({ message: 'Password changed successfully' });
        } catch (error) {
            next(error);
        }
    }

    async setup2FA(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.userId || (req as any).user.sub || (req as any).user.id;
            const setup = await this.authService.generate2FASecret(userId);

            res.json({ data: setup });
        } catch (error) {
            next(error);
        }
    }

    async enable2FA(req: Request, res: Response, next: NextFunction) {
        try {
            const validation = Enable2FASchema.safeParse(req.body);
            if (!validation.success) {
                throw new AppError('Invalid code format', 400);
            }

            const userId = (req as any).user.userId || (req as any).user.sub || (req as any).user.id;
            await this.authService.enable2FA(userId, validation.data.code);

            res.json({ message: '2FA enabled successfully' });
        } catch (error) {
            next(error);
        }
    }

    async disable2FA(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.userId || (req as any).user.sub || (req as any).user.id;
            await this.authService.disable2FA(userId);

            res.json({ message: '2FA disabled successfully' });
        } catch (error) {
            next(error);
        }
    }
}


