import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from '../database/entities/group.entity';
import { GroupRole } from '../database/entities/group-role.entity';
import { GroupMembership } from '../database/entities/group-membership.entity';
import { User } from '../database/entities/user.entity';
import { AuthModule } from '../auth/auth.module'; // For guards

@Module({
  imports: [
    TypeOrmModule.forFeature([Group, GroupRole, GroupMembership, User]),
    AuthModule, // Provides JwtAuthGuard
  ],
  providers: [GroupService],
  controllers: [GroupController],
  exports: [GroupService], // Export if needed by other modules
})
export class GroupModule {}
