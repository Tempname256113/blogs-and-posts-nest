import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class IUserApiCreateDto {
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
