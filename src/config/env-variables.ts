import { ConfigModule } from '@nestjs/config';

ConfigModule.forRoot();

export const envVariables = {
  MONGO_URL: process.env.MONGO_URL,
  MONGO_LOCAL: process.env.MONGO_LOCAL,
  JWT_SECRET_ACCESS_TOKEN: process.env.JWT_SECRET_ACCESS_TOKEN,
  JWT_SECRET_REFRESH_TOKEN: process.env.JWT_SECRET_REFRESH_TOKEN,
  MAIL_USER: process.env.MAIL_USER,
  MAIL_PASSWORD: process.env.MAIL_PASSWORD,
};
