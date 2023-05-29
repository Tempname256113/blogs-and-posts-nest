import { MaxLength } from 'class-validator';
import { IsStringWithTrim } from '../../../../../libs/validation/class-validator/string-with-trim.validation-decorator';
import { IsValidBlogId } from '../../../../../libs/validation/class-validator/is-valid-blogid.validation-decorator';

export class PostApiCreateUpdateDTO {
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
