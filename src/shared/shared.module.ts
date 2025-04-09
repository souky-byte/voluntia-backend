import { Module, Global } from '@nestjs/common';
import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerService } from './services/mailer.service';
import { join } from 'path'; // Needed for template path
// If using Handlebars templates:
// import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

@Global() // Make services available globally without importing SharedModule everywhere
@Module({
  imports: [
    NestMailerModule.forRootAsync({
      imports: [ConfigModule], // Ensure ConfigService is available
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('MAIL_HOST'),
          port: configService.get<number>('MAIL_PORT'),
          secure: configService.get<number>('MAIL_PORT') === 465, // true for 465, false for other ports
          auth: {
            user: configService.get<string>('MAIL_USER'),
            pass: configService.get<string>('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: configService.get<string>('MAIL_FROM'),
        },
        // --- Template Configuration (Example using Handlebars) ---
        // template: {
        //   dir: join(__dirname, 'templates'), // Path to email templates
        //   adapter: new HandlebarsAdapter(),
        //   options: {
        //     strict: true,
        //   },
        // },
      }),
    }),
  ],
  providers: [MailerService],
  exports: [MailerService], // Export the service
})
export class SharedModule {}
