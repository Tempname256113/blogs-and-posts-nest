import {
  IsBoolean,
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsStringWithTrim } from '../../../../../libs/validation/class-validator/string-with-trim.validation-decorator';

export class UserCreateDto {
  @IsString()
  @MaxLength(10)
  @MinLength(3)
  @Matches('^[a-zA-Z0-9_-]*$')
  login: string;

  @IsString()
  @MaxLength(20)
  @MinLength(6)
  password: string;

  @IsEmail()
  email: string;
}

export class UserBanUnbanDTO {
  @IsBoolean()
  isBanned: boolean;

  @IsStringWithTrim()
  @MinLength(20)
  banReason: string;
}
