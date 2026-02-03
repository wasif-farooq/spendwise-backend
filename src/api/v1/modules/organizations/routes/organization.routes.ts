import { Router } from 'express';
// import { OrganizationControllerFactory } from '@core/application/factories/OrganizationControllerFactory'; // Need to create factory
import { Container } from '@core/di/Container';
import { TOKENS } from '@core/di/tokens';
import { requireAuth } from '@core/api/middleware/auth.middleware';
import { requirePermission } from '@core/api/middleware/permission.middleware';
import { OrganizationRequestRepository } from '../repositories/OrganizationRequestRepository';
import { OrganizationController } from '../controllers/OrganizationController';

const router = Router();

const container = Container.getInstance();
const factory = container.resolve<any>(TOKENS.OrganizationControllerFactory);
const controller = factory.create();

router.use(requireAuth); // Protect all routes

router.get('/', controller.list.bind(controller));
router.put('/:id', requirePermission('organization:update'), controller.update.bind(controller));
router.delete('/:id', requirePermission('organization:delete'), controller.delete.bind(controller));

router.get('/:id/members', controller.getMembers.bind(controller));
router.post('/:id/members/invite', requirePermission('members:create'), controller.inviteMember.bind(controller));
router.delete('/:id/members/:memberId', requirePermission('members:delete'), controller.removeMember.bind(controller));
router.put('/:id/members/:memberId/role', requirePermission('members:edit'), controller.assignRole.bind(controller));

router.get('/:id/roles', requirePermission('roles:view'), controller.getRoles.bind(controller));
router.put('/:id/roles/:roleId', requirePermission('roles:edit'), controller.updateRole.bind(controller));
router.delete('/:id/roles/:roleId', requirePermission('roles:delete'), controller.deleteRole.bind(controller));

export default router;
