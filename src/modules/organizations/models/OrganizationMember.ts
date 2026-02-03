import { Entity } from '@api/shared/domain/entities/Entity';

export interface OrganizationMemberProps {
    userId: string;
    organizationId: string;
    roleId: string;
    joinedAt: Date;
}

export class OrganizationMember extends Entity<OrganizationMemberProps> {
    private constructor(props: OrganizationMemberProps, id?: string) {
        super(props, id);
    }

    public static create(props: {
        userId: string;
        organizationId: string;
        roleId: string;
    }, id?: string): OrganizationMember {
        const memberProps: OrganizationMemberProps = {
            ...props,
            joinedAt: new Date(),
        };
        return new OrganizationMember(memberProps, id);
    }

    public static restore(props: OrganizationMemberProps, id: string): OrganizationMember {
        return new OrganizationMember(props, id);
    }

    get userId(): string { return this.props.userId; }
    get organizationId(): string { return this.props.organizationId; }
    get roleId(): string { return this.props.roleId; }

    public changeRole(newRoleId: string): void {
        this.props.roleId = newRoleId;
    }
}
