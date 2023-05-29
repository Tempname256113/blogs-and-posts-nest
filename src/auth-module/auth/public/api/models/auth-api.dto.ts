import { IsEmail, Length } from 'class-validator';
import { IsStringWithTrim } from '../../../../../../libs/validation/class-validator/string-with-trim.validation-decorator';

export class AuthApiLoginDtoType {
  @IsStringWithTrim()
  loginOrEmail: string;

  @IsStringWithTrim()
  password: string;
}

export class AuthApiConfirmRegistrationDTO {
  @IsStringWithTrim()
  code: string;
}

export class AuthApiEmailPropertyDTO {
  @IsEmail()
  email: string;
}

export class NewPasswordDTO {
  @IsStringWithTrim()
  @Length(6, 20)
  newPassword: string;

  @IsStringWithTrim()
  recoveryCode: string;
}
