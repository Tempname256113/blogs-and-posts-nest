import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

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

export class NewPasswordDTO {
  @IsString()
  @MinLength(6)
  @MaxLength(20)
  newPassword: string;

  @IsString()
  recoveryCode: string;
}
