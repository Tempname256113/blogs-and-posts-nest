import { IsEmpty, IsString } from 'class-validator';

export class LikeDto {
  @IsString()
  @IsEmpty()
  likeStatus: 'None' | 'Like' | 'Dislike';
}
