import { ConfigModule } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

ConfigModule.forRoot();

// export const envConfiguration = {
//   MONGO_URL: process.env.MONGO_URL,
//   MONGO_LOCAL: process.env.MONGO_LOCAL,
//   JWT_SECRET_ACCESS_TOKEN: process.env.JWT_SECRET_ACCESS_TOKEN,
//   JWT_SECRET_REFRESH_TOKEN: process.env.JWT_SECRET_REFRESH_TOKEN,
//   MAIL_USER: process.env.MAIL_USER,
//   MAIL_PASSWORD: process.env.MAIL_PASSWORD,
//   BASIC_AUTH_LOGIN: process.env.BASIC_AUTH_LOGIN,
//   BASIC_AUTH_PASSWORD: process.env.BASIC_AUTH_PASSWORD,
// };

@Injectable()
export class EnvConfiguration {
  MONGO_URL: string;
  MONGO_LOCAL: string;
  JWT_SECRET_ACCESS_TOKEN: string;
  JWT_SECRET_REFRESH_TOKEN: string;
  MAIL_USER: string;
  MAIL_PASSWORD: string;
  BASIC_AUTH_LOGIN: string;
  BASIC_AUTH_PASSWORD: string;
  constructor() {
    this.MONGO_URL = process.env.MONGO_URL;
    this.MONGO_LOCAL = process.env.MONGO_LOCAL;
    this.JWT_SECRET_ACCESS_TOKEN = process.env.JWT_SECRET_ACCESS_TOKEN;
    this.JWT_SECRET_REFRESH_TOKEN = process.env.JWT_SECRET_REFRESH_TOKEN;
    this.MAIL_USER = process.env.MAIL_USER;
    this.MAIL_PASSWORD = process.env.MAIL_PASSWORD;
    this.BASIC_AUTH_LOGIN = process.env.BASIC_AUTH_LOGIN;
    this.BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD;
  }
}
