import { Router } from 'express';
import { Container } from '@core/di/Container';
import { TOKENS } from '@core/di/tokens';
import { FeatureFlagControllerFactory } from '@core/application/factories/FeatureFlagControllerFactory';

const router = Router();
const container = Container.getInstance();

// Note: We resolve the factory here. In a real app we might want to ensure bootstrap is done.
const factory = container.resolve<FeatureFlagControllerFactory>(TOKENS.FeatureFlagControllerFactory);
const controller = factory.create();

router.get('/', controller.getAll.bind(controller));

export default router;
