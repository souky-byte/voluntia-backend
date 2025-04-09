import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule } from './core/core.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PublicApplicationModule } from './public-application/public-application.module';
import { AdminApplicationModule } from './admin-application/admin-application.module';
import { SharedModule } from './shared/shared.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make ConfigModule available globally
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get<string>('NODE_ENV') === 'production';
        const databaseUrl = configService.get<string>('DATABASE_URL');

        return {
          type: 'postgres',
          url: databaseUrl,
          autoLoadEntities: true,
          synchronize: !isProduction,
          ssl: databaseUrl?.includes('sslmode=require')
            ? { rejectUnauthorized: false }
            : false,
        };
      },
    }),
    // Rate Limiting Configuration
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // Time window in milliseconds (e.g., 60 seconds)
        limit: 10,  // Max requests per window per IP
      },
      // You can define multiple throttlers (e.g., stricter limits for login)
    ]),
    CoreModule,
    AuthModule,
    UserModule,
    PublicApplicationModule,
    AdminApplicationModule,
    SharedModule,
    // Other modules will be added here later
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply ThrottlerGuard globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
