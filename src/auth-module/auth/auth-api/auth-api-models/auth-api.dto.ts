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

export class AuthApiEmailPropertyDTO {
  @IsEmail()
  email: string;
}
