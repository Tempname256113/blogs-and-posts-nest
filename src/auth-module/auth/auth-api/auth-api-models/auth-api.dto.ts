import {
  IsEmail,
  IsEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AuthApiLoginDtoType {
  @IsString()
  @IsEmpty()
  loginOrEmail: string;

  @IsString()
  @IsEmpty()
  password: string;
}

export class AuthApiConfirmRegistrationDTO {
  @IsString()
  @IsEmpty()
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
  @IsEmpty()
  recoveryCode: string;
}
