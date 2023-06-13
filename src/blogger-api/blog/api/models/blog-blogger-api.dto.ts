import { IsBoolean, IsUrl, MaxLength, MinLength } from 'class-validator';
import { IsStringWithTrim } from '../../../../../libs/validation/class-validator/string-with-trim.validation-decorator';
import { IsValidBlogId } from '../../../../../libs/validation/class-validator/is-valid-blogid.validation-decorator';

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

export class PostCreateUpdateBloggerApiDTO {
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

export class BanUserBloggerApiDTO {
  @IsBoolean()
  isBanned: boolean;

  @IsStringWithTrim()
  @MinLength(20)
  banReason: string;

  @IsValidBlogId()
  blogId: string;
}
