import { Length } from 'class-validator';
import { IsStringWithTrim } from '../../../../../libs/validation/class-validator/string-with-trim.validation-decorator';

export class CommentApiCreateDto {
  @IsStringWithTrim()
  @Length(20, 300)
  content: string;
}

export class CommentApiUpdateDTO {
  @IsStringWithTrim()
  @Length(20, 300)
  content: string;
}
