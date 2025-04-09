import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { User } from '../database/entities/user.entity';
import { Role } from '../database/entities/role.entity';
import { AdminController } from './admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role])],
  providers: [UserService],
  exports: [UserService],
  controllers: [AdminController]
})
export class UserModule {}
