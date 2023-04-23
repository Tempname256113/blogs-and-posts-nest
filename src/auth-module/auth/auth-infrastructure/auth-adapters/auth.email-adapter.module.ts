import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EnvConfiguration } from '../../../../app-configuration/env-configuration';
import { AuthEmailAdapterService } from './auth.email-adapter.service';

const envVariables = new EnvConfiguration();

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: envVariables.EMAIL_HOST,
        port: 465,
        secure: true,
        auth: {
          user: envVariables.EMAIL_USER,
          pass: envVariables.EMAIL_PASSWORD,
        },
      },
      defaults: {
        from: `"Temp256113. No Reply" <${envVariables.EMAIL_USER}>`,
      },
    }),
  ],
  providers: [AuthEmailAdapterService],
  exports: [AuthEmailAdapterService],
})
export class AuthEmailAdapterModule {}
