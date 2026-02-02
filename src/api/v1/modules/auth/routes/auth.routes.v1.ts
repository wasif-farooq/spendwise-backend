import { Router } from 'express';
import { AuthControllerFactory } from '@core/application/factories/AuthControllerFactory';
import { Container } from '@core/di/Container';
import { TOKENS } from '@core/di/tokens';
import { validate } from '@core/api/middleware/validate.middleware';
import { registerSchema, loginSchema } from '../validators/auth.validation';

const router = Router();
const container = Container.getInstance();
const factory = container.resolve<AuthControllerFactory>(TOKENS.AuthControllerFactory);
const controller = factory.create();

router.post('/login', validate(loginSchema), controller.login);
router.post('/register', validate(registerSchema), controller.register);

export default router;
