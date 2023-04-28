import { IsString } from 'class-validator';

export class LikeDto {
  @IsString()
  likeStatus: 'None' | 'Like' | 'Dislike';
}
