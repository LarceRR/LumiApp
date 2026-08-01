import { Module } from '@nestjs/common';

import { BillingModule } from '@/modules/billing/billing.module';
import { SurfacesModule } from '@/modules/surfaces/surfaces.module';
import { UsersModule } from '@/modules/users/users.module';

import { CreateSpaceHandler } from './application/commands/createSpace.handler';
import { InviteMemberHandler } from './application/commands/inviteMember.handler';
import { RespondToInvitationHandler } from './application/commands/respondToInvitation.handler';
import { ListSpacesHandler } from './application/queries/listSpaces.handler';
import { SpaceAccessService } from './application/services/spaceAccess.service';
import { SPACE_REPOSITORY } from './domain/repositories/SpaceRepository';
import { DrizzleSpaceRepository } from './infrastructure/repositories/drizzleSpaceRepository';
import { SpacesController } from './presentation/controllers/spaces.controller';

@Module({
  imports: [UsersModule, SurfacesModule, BillingModule],
  controllers: [SpacesController],
  providers: [
    { provide: SPACE_REPOSITORY, useClass: DrizzleSpaceRepository },
    SpaceAccessService,
    ListSpacesHandler,
    CreateSpaceHandler,
    InviteMemberHandler,
    RespondToInvitationHandler,
  ],
  // SpaceAccessService is the shared entry point for permission checks, so guards
  // and other modules can depend on it without reaching for the repository.
  exports: [SPACE_REPOSITORY, SpaceAccessService, CreateSpaceHandler],
})
export class SpacesModule {}
