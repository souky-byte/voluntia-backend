import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicApplicationService } from './public-application.service';
import { PublicApplicationController } from './public-application.controller';
import { Application } from '../database/entities/application.entity';
import { User } from '../database/entities/user.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Application, User]),
    UserModule,
  ],
  providers: [PublicApplicationService],
  controllers: [PublicApplicationController]
})
export class PublicApplicationModule {}
