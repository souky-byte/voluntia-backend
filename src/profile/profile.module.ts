import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
  ],
  providers: [ProfileService],
  controllers: [ProfileController]
})
export class ProfileModule {}
