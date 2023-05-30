import { IsUrl, MaxLength } from 'class-validator';
import { IsStringWithTrim } from '../../../../../libs/validation/class-validator/string-with-trim.validation-decorator';

export class BlogBloggerApiCreateUpdateDTO {
  @IsStringWithTrim()
  @MaxLength(15)
  name: string;

  @IsStringWithTrim()
  @MaxLength(500)
  description: string;

  @IsUrl()
  @MaxLength(100)
  websiteUrl: string;
}

export class BlogBloggerApiCreatePostDTO {
  @IsStringWithTrim()
  @MaxLength(30)
  title: string;

  @IsStringWithTrim()
  @MaxLength(100)
  shortDescription: string;

  @IsStringWithTrim()
  @MaxLength(1000)
  content: string;
}
