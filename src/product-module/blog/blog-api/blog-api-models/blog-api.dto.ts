import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';
import { IsStringWithTrim } from '../../../../app-helpers/class-validator/string-with-trim.validation-decorator';

export class IBlogApiCreateUpdateDTO {
  @IsStringWithTrim()
  @IsNotEmpty()
  @MaxLength(15)
  name: string;

  @IsStringWithTrim()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @IsUrl()
  @MaxLength(100)
  websiteUrl: string;
}

export class IBlogApiCreatePostDTO {
  @IsStringWithTrim()
  @IsNotEmpty()
  @MaxLength(30)
  title: string;

  @IsStringWithTrim()
  @IsNotEmpty()
  @MaxLength(100)
  shortDescription: string;

  @IsStringWithTrim()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;
}
