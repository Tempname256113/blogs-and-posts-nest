import { IsEmail, IsString } from 'class-validator';

export class AuthApiLoginDtoType {
  @IsString()
  loginOrEmail: string;

  @IsString()
  password: string;
}

export class AuthApiConfirmRegistrationDTO {
  @IsString()
  code: string;
}

export class AuthApiEmailResendingDTO {
  @IsEmail()
  email: string;
}
