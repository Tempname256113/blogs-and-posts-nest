import { IsStringWithTrim } from '../../app-helpers/class-validator/string-with-trim.validation-decorator';

export class LikeDto {
  @IsStringWithTrim()
  likeStatus: 'None' | 'Like' | 'Dislike';
}
