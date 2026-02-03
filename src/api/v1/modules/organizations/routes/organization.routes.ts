import { Router } from 'express';
// import { OrganizationControllerFactory } from '@core/application/factories/OrganizationControllerFactory'; // Need to create factory
import { Container } from '@core/di/Container';
import { TOKENS } from '@core/di/tokens';
import { requireAuth } from '@core/api/middleware/auth.middleware'; // Assuming auth middleware exists
import { OrganizationRequestRepository } from '../repositories/OrganizationRequestRepository';
import { OrganizationController } from '../controllers/OrganizationController';

const router = Router();

const container = Container.getInstance();
const factory = container.resolve<any>(TOKENS.OrganizationControllerFactory);
const controller = factory.create();

router.use(requireAuth); // Protect all routes

router.get('/', controller.list.bind(controller));
router.put('/:id', controller.update.bind(controller));
router.delete('/:id', controller.delete.bind(controller));

router.get('/:id/members', controller.getMembers.bind(controller));
router.post('/:id/members/invite', controller.inviteMember.bind(controller));
router.delete('/:id/members/:memberId', controller.removeMember.bind(controller));
router.put('/:id/members/:memberId/role', controller.assignRole.bind(controller));

router.get('/:id/roles', controller.getRoles.bind(controller));
router.put('/:id/roles/:roleId', controller.updateRole.bind(controller));
router.delete('/:id/roles/:roleId', controller.deleteRole.bind(controller));

export default router;
