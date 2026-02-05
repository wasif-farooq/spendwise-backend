import { NextFunction, Request, Response } from 'express';
import { UserRequestRepository } from '../users/repositories/UserRequestRepository';
import { AuthRequestRepository } from '../auth/repositories/AuthRequestRepository';
import { AppError } from '@core/api/utils/AppError';

export class SettingsController {
    constructor(
        private userRequestRepository: UserRequestRepository,
        private authRequestRepository: AuthRequestRepository
    ) { }

    async getPreferences(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.userId || (req as any).user.sub || (req as any).user.id;
            const result = await this.userRequestRepository.getPreferences(userId);

            if (result.error) {
                throw new AppError(result.error, result.statusCode || 400);
            }

            res.json({ data: result });
        } catch (error) {
            next(error);
        }
    }

    async updatePreferences(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.userId || (req as any).user.sub || (req as any).user.id;
            const result = await this.userRequestRepository.updatePreferences(userId, req.body);

            if (result.error) {
                throw new AppError(result.error, result.statusCode || 400);
            }

            res.json({ data: result });
        } catch (error) {
            next(error);
        }
    }

    async getSecuritySettings(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.userId || (req as any).user.sub || (req as any).user.id;
            const result = await this.authRequestRepository.getMe(userId);

            if (result.error) {
                throw new AppError(result.error, result.statusCode || 400);
            }

            res.json({
                data: {
                    twoFactorEnabled: result.twoFactorEnabled || false,
                    twoFactorMethod: result.twoFactorMethod,
                }
            });
        } catch (error) {
            next(error);
        }
    }

    async changePassword(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.userId || (req as any).user.sub || (req as any).user.id;
            const result = await this.authRequestRepository.changePassword(userId, req.body);

            if (result.error) {
                throw new AppError(result.error, result.statusCode || 400);
            }

            res.json({ message: 'Password changed successfully' });
        } catch (error) {
            next(error);
        }
    }

    async setup2FA(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.userId || (req as any).user.sub || (req as any).user.id;
            const result = await this.authRequestRepository.generate2FASecret(userId);

            if (result.error) {
                throw new AppError(result.error, result.statusCode || 400);
            }

            res.json({ data: result });
        } catch (error) {
            next(error);
        }
    }

    async enable2FA(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.userId || (req as any).user.sub || (req as any).user.id;
            const result = await this.authRequestRepository.enable2FA(userId, req.body.code);

            if (result.error) {
                throw new AppError(result.error, result.statusCode || 400);
            }

            res.json({ message: '2FA enabled successfully' });
        } catch (error) {
            next(error);
        }
    }

    async disable2FA(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.userId || (req as any).user.sub || (req as any).user.id;
            const result = await this.authRequestRepository.disable2FA(userId);

            if (result.error) {
                throw new AppError(result.error, result.statusCode || 400);
            }

            res.json({ message: '2FA disabled successfully' });
        } catch (error) {
            next(error);
        }
    }
}


