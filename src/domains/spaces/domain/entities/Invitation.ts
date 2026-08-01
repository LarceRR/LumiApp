import type { Email } from '@/domains/auth/domain/value-objects/Email';

import type { SpaceId } from '../value-objects/SpaceId';

export type InvitationStatus = 'Pending' | 'Accepted' | 'Rejected';

export type Invitation = {
  readonly id: string;
  readonly spaceId: SpaceId;
  readonly status: InvitationStatus;
  readonly invitedEmail: Email;
  readonly createdAt: number;
};
