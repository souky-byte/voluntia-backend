import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
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
import { ProfileModule } from './profile/profile.module';
import { GroupModule } from './group/group.module';
import { Group } from './database/entities/group.entity';
import { GroupMembership } from './database/entities/group-membership.entity';
import { RequestLoggerMiddleware } from './core/middleware/request-logger.middleware';
import { StripeModule } from './stripe/stripe.module';
import { PaymentsModule } from './payments/payments.module';
import { Contribution } from './database/entities/contribution.entity';
import { User } from './database/entities/user.entity';
import { Role } from './database/entities/role.entity';
import { Application } from './database/entities/application.entity';

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
          entities: [User, Role, Application, Group, GroupMembership, Contribution],
        };
      },
    }),
    // Rate Limiting Configuration - Dynamic based on environment
    ThrottlerModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => {
            const isProduction = config.get<string>('NODE_ENV') === 'production';
            return [
                {
                    // Stricter limits for production, looser for development
                    ttl: isProduction ? 60000 : 1000, // 1 minute (prod) vs 1 second (dev)
                    limit: isProduction ? 20 : 1000, // 20 requests/min (prod) vs 1000/sec (dev)
                },
            ];
        },
    }),
    CoreModule,
    AuthModule,
    UserModule,
    PublicApplicationModule,
    AdminApplicationModule,
    SharedModule,
    ProfileModule,
    GroupModule,
    StripeModule,
    PaymentsModule,
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
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(RequestLoggerMiddleware)
            .forRoutes('*');
    }
}
