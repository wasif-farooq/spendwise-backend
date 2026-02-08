import { Router } from 'express';
// import { OrganizationControllerFactory } from '@core/application/factories/OrganizationControllerFactory'; // Need to create factory
import { Container } from '@core/di/Container';
import { TOKENS } from '@core/di/tokens';
import { requireAuth } from '@core/api/middleware/auth.middleware';
import { requirePermission } from '@core/api/middleware/permission.middleware';
import { OrganizationRequestRepository } from '../repositories/OrganizationRequestRepository';
import { OrganizationController } from '../controllers/OrganizationController';

import organizationRolesRoutes from './organization-roles.routes';

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

router.use('/:id/roles', organizationRolesRoutes);

export default router;
