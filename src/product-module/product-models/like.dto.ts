import { IsLike } from '../../app-helpers/class-validator/is-like.validation-decorator';

export class LikeDto {
  @IsLike()
  likeStatus: 'None' | 'Like' | 'Dislike';
}
