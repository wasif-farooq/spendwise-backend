import { Inject } from '@core/di/decorators/inject.decorator';
import { TOKENS } from '@core/di/tokens';
import { OrganizationRepository } from '../repositories/OrganizationRepository';
import { OrganizationMembersRepository } from '../repositories/OrganizationMembersRepository';
import { OrganizationRoleRepository } from '../repositories/OrganizationRoleRepository';
import { IUserRepository } from '@modules/auth/repositories/IUserRepository';
import { Organization } from '../models/Organization';
import { OrganizationMember } from '../models/OrganizationMember';
import { AppError } from '@core/api/utils/AppError';
import { UpdateOrganizationDto, InviteMemberDto } from '../dto/organization.dto';

export class OrganizationService {
    constructor(
        @Inject(TOKENS.OrganizationRepository) private organizationRepository: OrganizationRepository,
        @Inject(TOKENS.OrganizationMembersRepository) private organizationMembersRepository: OrganizationMembersRepository,
        @Inject(TOKENS.OrganizationRoleRepository) private organizationRoleRepository: OrganizationRoleRepository,
        @Inject('UserRepository') private userRepository: IUserRepository
    ) { }

    async update(orgId: string, userId: string, dto: UpdateOrganizationDto): Promise<Organization> {
        const member = await this.organizationMembersRepository.findByUserAndOrg(userId, orgId);
        if (!member) {
            throw new AppError('Not a member of this organization', 403);
        }

        const organization = await this.organizationRepository.findById(orgId);
        if (!organization) {
            throw new AppError('Organization not found', 404);
        }

        // Permission check
        const hasPermission = await this.checkPermission(orgId, userId, 'org:update');
        if (!hasPermission) {
            throw new AppError('Insufficient permissions to update organization', 403);
        }

        if (dto.name) organization.changeName(dto.name);
        await this.organizationRepository.save(organization);
        return organization;
    }

    async delete(orgId: string, userId: string): Promise<void> {
        const organization = await this.organizationRepository.findById(orgId);
        if (!organization) {
            throw new AppError('Organization not found', 404);
        }

        if (organization.ownerId !== userId) {
            throw new AppError('Only owner can delete organization', 403);
        }

        await this.organizationRepository.delete(orgId);
    }

    async getUserOrganizations(userId: string): Promise<Organization[]> {
        const memberships = await this.organizationMembersRepository.findByUserId(userId);
        if (memberships.length === 0) return [];

        const orgIds = memberships.map(m => m.organizationId);
        return this.organizationRepository.findByIds(orgIds);
    }

    async getMembers(orgId: string, userId: string): Promise<any[]> {
        const member = await this.organizationMembersRepository.findByUserAndOrg(userId, orgId);
        if (!member) {
            throw new AppError('Not a member of this organization', 403);
        }

        return this.organizationMembersRepository.findAllWithDetails(orgId);
    }

    async inviteMember(orgId: string, userId: string, dto: InviteMemberDto): Promise<void> {
        const hasPermission = await this.checkPermission(orgId, userId, 'member:manage');
        if (!hasPermission) {
            throw new AppError('Insufficient permissions to invite members', 403);
        }

        const userToInvite = await this.userRepository.findByEmail(dto.email);
        if (!userToInvite) {
            throw new AppError('User not found. Invite flow for non-existent users not implemented yet.', 400);
        }

        const existingMember = await this.organizationMembersRepository.findByUserAndOrg(userToInvite.id, orgId);
        if (existingMember) {
            throw new AppError('User is already a member', 409);
        }

        const role = await this.organizationRoleRepository.findByNameAndOrg(dto.roleName, orgId);
        if (!role) throw new AppError('Role not found', 404);

        const newMember = OrganizationMember.create({
            organizationId: orgId,
            userId: userToInvite.id,
            roleIds: [role.id]
        });

        await this.organizationMembersRepository.create(newMember);
    }

    async removeMember(orgId: string, userId: string, memberIdToRemove: string): Promise<void> {
        const hasPermission = await this.checkPermission(orgId, userId, 'member:manage');
        if (!hasPermission) {
            throw new AppError('Insufficient permissions to remove members', 403);
        }

        const memberToRemove = await this.organizationMembersRepository.findById(memberIdToRemove);
        if (!memberToRemove || memberToRemove.organizationId !== orgId) {
            throw new AppError('Member not found', 404);
        }

        await this.organizationMembersRepository.delete(memberIdToRemove);
    }

    async getRoles(orgId: string, userId: string): Promise<any[]> {
        const member = await this.organizationMembersRepository.findByUserAndOrg(userId, orgId);
        if (!member) throw new AppError('Not a member of this organization', 403);

        return this.organizationRoleRepository.findByOrg(orgId);
    }

    async updateRole(orgId: string, userId: string, roleId: string, permissions: string[]): Promise<void> {
        const hasPermission = await this.checkPermission(orgId, userId, 'role:manage');
        if (!hasPermission) throw new AppError('Insufficient permissions to manage roles', 403);

        const role = await this.organizationRoleRepository.findById(roleId);
        if (!role || role.organizationId !== orgId) throw new AppError('Role not found', 404);

        role.changePermissions(permissions);
        await this.organizationRoleRepository.save(role);
    }

    async assignRole(orgId: string, userId: string, memberId: string, roleId: string): Promise<void> {
        const hasPermission = await this.checkPermission(orgId, userId, 'member:manage');
        if (!hasPermission) throw new AppError('Insufficient permissions to assign roles', 403);

        const member = await this.organizationMembersRepository.findById(memberId);
        if (!member || member.organizationId !== orgId) throw new AppError('Member not found', 404);

        const role = await this.organizationRoleRepository.findById(roleId);
        if (!role || role.organizationId !== orgId) throw new AppError('Role not valid for this organization', 400);

        member.addRole(roleId);
        await this.organizationMembersRepository.save(member);
    }

    async deleteRole(orgId: string, userId: string, roleId: string): Promise<void> {
        const hasPermission = await this.checkPermission(orgId, userId, 'role:manage');
        if (!hasPermission) throw new AppError('Insufficient permissions to delete roles', 403);

        const role = await this.organizationRoleRepository.findById(roleId);
        if (!role || role.organizationId !== orgId) throw new AppError('Role not found', 404);

        if (role.isSystem) throw new AppError('Cannot delete system role', 400);

        // Check if strictly assigned
        // Note: With multiple roles, we'd need a specialized query to check if ANY member has this role in their role_ids array.
        // For simplicity, we can do this in SQL or here if countByRole is updated.
        const assignedCount = await this.organizationMembersRepository.countByRole(roleId);
        if (assignedCount > 0) throw new AppError('Cannot delete role with assigned members', 400);

        await this.organizationRoleRepository.delete(roleId);
    }

    async checkPermission(orgId: string, userId: string, permission: string): Promise<boolean> {
        const organization = await this.organizationRepository.findById(orgId);
        if (!organization) return false;

        if (organization.ownerId === userId) return true;

        const member = await this.organizationMembersRepository.findByUserAndOrg(userId, orgId);
        if (!member) return false;

        if (member.roleIds.length === 0) return false;

        const roles = await this.organizationRoleRepository.findByIds(member.roleIds);
        return roles.some(role => role.permissions.includes('*') || role.permissions.includes(permission));
    }
}
