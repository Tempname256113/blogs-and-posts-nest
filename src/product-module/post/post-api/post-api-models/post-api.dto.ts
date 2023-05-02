import { MaxLength } from 'class-validator';
import { IsStringWithTrim } from '../../../../app-helpers/class-validator/string-with-trim.validation-decorator';
import { IsValidBlogId } from '../../../../app-helpers/class-validator/is-valid-blogid.validation-decorator';

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

  @IsValidBlogId()
  blogId: string;
}
