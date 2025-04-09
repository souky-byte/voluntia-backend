import { Injectable, Logger } from '@nestjs/common';
import { MailerService as NestModulesMailerService } from '@nestjs-modules/mailer';
import { SentMessageInfo } from 'nodemailer';
import { User } from '../../database/entities/user.entity';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(private readonly nestMailerService: NestModulesMailerService) {}

  /**
   * Sends a welcome email to a newly approved user.
   * @param user - The user entity.
   * @param temporaryPassword - The temporary password generated for the user.
   * @returns Promise resolving to the result of sending the email.
   */
  async sendWelcomeEmail(
    user: User,
    temporaryPassword: string,
  ): Promise<SentMessageInfo> {
    const subject = 'Vítejte ve Voluntia!';
    // TODO: Create proper HTML templates for emails
    const html = `
      <h1>Vítejte, ${user.name}!</h1>
      <p>Vaše žádost o zapojení do Voluntia byla schválena.</p>
      <p>Nyní se můžete přihlásit pomocí své emailové adresy (${user.email}) a dočasného hesla:</p>
      <p><b>${temporaryPassword}</b></p>
      <p>Po prvním přihlášení si prosím změňte heslo.</p>
      <p>Odkaz na přihlášení: [TODO: Add Login URL]</p>
      <br>
      <p>S pozdravem,</p>
      <p>Tým Voluntia</p>
    `;

    try {
      const result = await this.nestMailerService.sendMail({
        to: user.email,
        subject: subject,
        html: html,
        // from: is automatically handled by the module config based on .env
      });
      this.logger.log(`Welcome email successfully sent to ${user.email}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${user.email}`, error.stack);
      // Re-throw the error to be handled by the calling service (e.g., approveApplication)
      // Or handle it differently (e.g., queue for retry)
      throw error;
    }
  }

  // TODO: Add other email sending methods as needed (e.g., password reset, notifications)
} 