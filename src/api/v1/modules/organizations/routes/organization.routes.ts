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
router.put('/:id', requirePermission('org:update'), controller.update.bind(controller));
router.delete('/:id', requirePermission('org:delete'), controller.delete.bind(controller));

router.get('/:id/members', controller.getMembers.bind(controller));
router.post('/:id/members/invite', requirePermission('member:manage'), controller.inviteMember.bind(controller));
router.delete('/:id/members/:memberId', requirePermission('member:manage'), controller.removeMember.bind(controller));
router.put('/:id/members/:memberId/role', requirePermission('member:manage'), controller.assignRole.bind(controller));

router.get('/:id/roles', requirePermission('role:read'), controller.getRoles.bind(controller));
router.put('/:id/roles/:roleId', requirePermission('role:manage'), controller.updateRole.bind(controller));
router.delete('/:id/roles/:roleId', requirePermission('role:manage'), controller.deleteRole.bind(controller));

export default router;
