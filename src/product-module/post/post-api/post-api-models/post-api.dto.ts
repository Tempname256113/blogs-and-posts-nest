import { IsString, MaxLength } from 'class-validator';
import { IsStringWithTrim } from '../../../../app-helpers/class-validator/string-with-trim.validation-decorator';

export class IPostApiCreateUpdateDTO {
  @IsStringWithTrim()
  @MaxLength(30)
  title: string;

  @IsStringWithTrim()
  @MaxLength(100)
  shortDescription: string;

  @IsStringWithTrim()
  @MaxLength(1000)
  content: string;

  @IsString()
  blogId: string;
}
