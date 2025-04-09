import { Module } from '@nestjs/common';
import { AdminApplicationService } from './admin-application.service';
import { AdminApplicationController } from './admin-application.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from '../database/entities/application.entity';
import { User } from '../database/entities/user.entity';
import { Role } from '../database/entities/role.entity';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Application, User, Role]),
    AuthModule,
    UserModule,
    SharedModule,
  ],
  providers: [AdminApplicationService],
  controllers: [AdminApplicationController],
})
export class AdminApplicationModule {}
