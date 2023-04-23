import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AuthEmailAdapterService {
  constructor(private mailerService: MailerService) {}

  async sendUserConfirmation(userEmail: string, confirmationCode: string) {
    const html = `<h1>Thank for your registration</h1>
       <p>To finish registration please follow the link below:
          <a href=https://somesite.com/confirm-email?code=${confirmationCode}>complete registration</a>
      </p>`;

    await this.mailerService.sendMail({
      to: userEmail,
      subject: 'Confirm registration please',
      html,
    });
  }
}
