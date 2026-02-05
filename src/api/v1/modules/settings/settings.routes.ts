import { Router } from 'express';
import { requireAuth } from '@core/api/middleware/auth.middleware';
import { SettingsController } from './SettingsController';
import { UserRequestRepository } from '../users/repositories/UserRequestRepository';
import { AuthRequestRepository } from '../auth/repositories/AuthRequestRepository';
import { Container } from '@core/di/Container';
import { TOKENS } from '@core/di/tokens';

const router = Router();

// Resolve dependencies
const container = Container.getInstance();
const userRequestRepository = new UserRequestRepository();
const authRequestRepository = new AuthRequestRepository();

const controller = new SettingsController(userRequestRepository, authRequestRepository);

router.use(requireAuth);

router.get('/preferences', controller.getPreferences.bind(controller));
router.put('/preferences', controller.updatePreferences.bind(controller));
router.get('/security', controller.getSecuritySettings.bind(controller));
router.put('/change-password', controller.changePassword.bind(controller));
router.post('/2fa/setup', controller.setup2FA.bind(controller));
router.post('/2fa/enable', controller.enable2FA.bind(controller));
router.post('/2fa/disable', controller.disable2FA.bind(controller));


export default router;
