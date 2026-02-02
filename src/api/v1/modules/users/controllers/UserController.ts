import { Request, Response, NextFunction } from 'express';
import { UserService } from '@modules/users/services/UserService';
import { AppError } from '@core/api/utils/AppError';

export class UserController {
    constructor(private userService: UserService) { }

    async getProfile(req: Request, res: Response) {
        const userId = (req as any).user?.userId;

        if (!userId) {
            throw new AppError('Unauthorized', 401);
        }

        const user = await this.userService.getProfile(userId);
        res.json(user);
    }

    async updateProfile(req: Request, res: Response) {
        const userId = (req as any).user?.userId;
        if (!userId) {
            throw new AppError('Unauthorized', 401);
        }

        const user = await this.userService.updateProfile(userId, req.body);
        res.json(user);
    }
}
