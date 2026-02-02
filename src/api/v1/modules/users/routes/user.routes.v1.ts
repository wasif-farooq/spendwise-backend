import { Router } from 'express';
import { UserControllerFactory } from '@core/application/factories/UserControllerFactory';
import { Container } from '@core/di/Container';
import { TOKENS } from '@core/di/tokens';
import { authMiddleware } from '@core/api/middleware/auth.middleware';

const router = Router();
const container = Container.getInstance();
const factory = container.resolve<UserControllerFactory>(TOKENS.UserControllerFactory);
const controller = factory.create();

router.get('/profile', authMiddleware, controller.getProfile);
router.put('/profile', authMiddleware, controller.updateProfile);

export default router;
