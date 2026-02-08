import { ServiceFactory } from './ServiceFactory';
import { OrganizationRequestRepository } from '@api/v1/modules/organizations/repositories/OrganizationRequestRepository';
import { OrganizationRolesController } from '@api/v1/modules/organizations/controllers/OrganizationRolesController';

export class OrganizationRolesControllerFactory {
    constructor(private serviceFactory: ServiceFactory) { }

    create(repository?: OrganizationRequestRepository): OrganizationRolesController {
        return new OrganizationRolesController(repository || new OrganizationRequestRepository());
    }
}
