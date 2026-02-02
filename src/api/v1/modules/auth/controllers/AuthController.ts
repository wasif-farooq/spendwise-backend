import { Request, Response, NextFunction } from 'express';
// import { AuthService } from '@modules/auth/application/services/AuthService'; 
// Moving to RPC Repository Pattern
import { AuthRequestRepository } from '../repositories/AuthRequestRepository';

export class AuthController {
    constructor(private authRequestRepository: AuthRequestRepository) { }

    async login(req: Request, res: Response) {
        // Delegate to Repository -> Kafka
        const result = await this.authRequestRepository.login(req.body);

        if (result.error) {
            res.status(result.statusCode || 400).json({ message: result.error });
            return;
        }

        res.json(result);
    }

    async register(req: Request, res: Response) {
        // Delegate to Repository -> Kafka
        const result = await this.authRequestRepository.register(req.body);

        if (result.error) {
            res.status(result.statusCode || 400).json({ message: result.error });
            return;
        }

        res.status(201).json(result);
    }
}
