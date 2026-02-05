import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ConfigLoader } from '@core/config/ConfigLoader';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    console.log(`[AuthMiddleware] Received Header: ${authHeader ? 'Present' : 'Missing'}`);
    if (authHeader) {
        console.log(`[AuthMiddleware] Token (first 20 chars): ${authHeader.substring(0, 20)}...`);
    }

    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
        return res.status(401).json({ message: 'Token error' });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({ message: 'Token malformatted' });
    }

    try {
        const config = ConfigLoader.getInstance();
        const secret = config.get('auth.jwt.secret');
        const decoded = jwt.verify(token, secret);

        (req as any).user = decoded;

        return next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

export const requireAuth = authMiddleware;

