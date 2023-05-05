import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class NodemailerService {
  constructor(private mailerService: MailerService) {}

  async sendUserConfirmation(
    userEmail: string,
    confirmationCode: string,
  ): Promise<void> {
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

  async sendPasswordRecovery(
    userEmail: string,
    passwordRecoveryCode: string,
  ): Promise<void> {
    const html = `<h1>Password recovery code</h1>
       <p>To finish password recovery operation please follow the link below:
          <a href=https://somesite.com/confirm-email?code=${passwordRecoveryCode}>confirm password recovery</a>
      </p>`;

    await this.mailerService.sendMail({
      to: userEmail,
      subject: 'Password recovery',
      html,
    });
  }
}
