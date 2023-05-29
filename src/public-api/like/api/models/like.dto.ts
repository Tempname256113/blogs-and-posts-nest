import { IsLike } from '../../../../../libs/validation/class-validator/is-like.validation-decorator';

export class LikeDto {
  @IsLike()
  likeStatus: 'None' | 'Like' | 'Dislike';
}
