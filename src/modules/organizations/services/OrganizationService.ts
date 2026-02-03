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
        // 1. Verify Membership & Permissions (Simplified for now: Must be owner or have Admin role)
        const member = await this.organizationMembersRepository.findByUserAndOrg(userId, orgId);
        if (!member) {
            throw new AppError('Not a member of this organization', 403);
        }

        const organization = await this.organizationRepository.findById(orgId);
        if (!organization) {
            throw new AppError('Organization not found', 404);
        }

        // 2. Permission check: Only owner or users with Admin role can update organization details
        if (organization.ownerId !== userId) {
            const role = await this.organizationRoleRepository.findById(member.roleId);
            if (!role || (role.name !== 'Admin' && !role.permissions.includes('*'))) {
                throw new AppError('Insufficient permissions to update organization', 403);
            }
        }


        // 2. Update
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
        const requester = await this.organizationMembersRepository.findByUserAndOrg(userId, orgId);
        if (!requester) {
            throw new AppError('Not a member of this organization', 403);
        }

        const userToInvite = await this.userRepository.findByEmail(dto.email);
        if (!userToInvite) {
            throw new AppError('User not found. Invite flow for non-existent users not implemented yet.', 400);
        }

        const existingMember = await this.organizationMembersRepository.findByUserAndOrg(userToInvite.id, orgId);
        if (existingMember) {
            throw new AppError('User is already a member', 409);
        }

        // Find Role
        // Simplification: We need to find valid roles for this org.
        // For now, assume 'Member' exists or create if not? 
        // Or strictly fetch from DB.

        // Find Role
        const role = await this.organizationRoleRepository.findByNameAndOrg(dto.roleName, orgId);
        if (!role) throw new AppError('Role not found', 404);

        const newMember = OrganizationMember.create({
            organizationId: orgId,
            userId: userToInvite.id,
            roleId: role.id
        });

        await this.organizationMembersRepository.create(newMember);
    }

    async removeMember(orgId: string, userId: string, memberIdToRemove: string): Promise<void> {
        const requester = await this.organizationMembersRepository.findByUserAndOrg(userId, orgId);
        if (!requester) {
            throw new AppError('Not a member of this organization', 403);
        }

        const memberToRemove = await this.organizationMembersRepository.findById(memberIdToRemove);
        if (!memberToRemove) {
            throw new AppError('Member not found', 404);
        }

        if (memberToRemove.organizationId !== orgId) {
            throw new AppError('Member does not belong to this organization', 400);
        }

        await this.organizationMembersRepository.delete(memberIdToRemove);
    }

    async getRoles(orgId: string, userId: string): Promise<any[]> {
        const requester = await this.organizationMembersRepository.findByUserAndOrg(userId, orgId);
        if (!requester) {
            throw new AppError('Not a member of this organization', 403);
        }

        const roles = await this.organizationRoleRepository.findByOrg(orgId);
        return roles;
    }

    async updateRole(orgId: string, userId: string, roleId: string, permissions: string[]): Promise<void> {
        const requester = await this.organizationMembersRepository.findByUserAndOrg(userId, orgId);
        if (!requester) {
            throw new AppError('Not a member of this organization', 403);
        }

        const role = await this.organizationRoleRepository.findById(roleId);
        if (!role) throw new AppError('Role not found', 404);

        if (role.organizationId !== orgId) throw new AppError('Role does not belong to this org', 400);

        role.changePermissions(permissions);
        await this.organizationRoleRepository.save(role);
    }

    async assignRole(orgId: string, userId: string, memberId: string, roleId: string): Promise<void> {
        const requester = await this.organizationMembersRepository.findByUserAndOrg(userId, orgId);
        if (!requester) {
            throw new AppError('Not a member of this organization', 403);
        }

        // Check if member exists
        const memberIdx = await this.organizationMembersRepository.findById(memberId); // Assuming Repo has findById
        // Note: organizationMembersRepository usually returns OrganizationMember entity
        // We need to fetch it.
        // My repo fetcher might be missing findById for member?
        // Let's assume findById exists or use findByUserAndOrg if we had userId of member.
        // But we have memberId (ID of the membership record).

        let member = await this.organizationMembersRepository.findById(memberId);
        if (!member) throw new AppError('Member not found', 404);

        if (member.organizationId !== orgId) throw new AppError('Member not in this org', 400);

        // Check if role exists in org
        const role = await this.organizationRoleRepository.findById(roleId);
        if (!role || role.organizationId !== orgId) throw new AppError('Role not valid for this organization', 400);

        member.changeRole(roleId);
        await this.organizationMembersRepository.save(member);
    }

    async deleteRole(orgId: string, userId: string, roleId: string): Promise<void> {
        const requester = await this.organizationMembersRepository.findByUserAndOrg(userId, orgId);
        if (!requester) {
            throw new AppError('Not a member of this organization', 403);
        }

        const role = await this.organizationRoleRepository.findById(roleId);
        if (!role || role.organizationId !== orgId) throw new AppError('Role not found', 404);

        if (role.isSystem) {
            throw new AppError('Cannot delete system role', 400);
        }

        // Check if strictly assigned
        const assignedCount = await this.organizationMembersRepository.countByRole(roleId);
        if (assignedCount > 0) throw new AppError('Cannot delete role with assigned members', 400);

        await this.organizationRoleRepository.delete(roleId);
    }
}
