import { ServiceFactory } from './ServiceFactory';
import { OrganizationRequestRepository } from '@api/v1/modules/organizations/repositories/OrganizationRequestRepository';
import { OrganizationController } from '@api/v1/modules/organizations/controllers/OrganizationController';

export class OrganizationControllerFactory {
    constructor(private serviceFactory: ServiceFactory) { }

    create(repository?: OrganizationRequestRepository): OrganizationController {
        return new OrganizationController(repository || new OrganizationRequestRepository());
    }
}
