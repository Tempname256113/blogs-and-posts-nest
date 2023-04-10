import { LikeEntity } from './like.entity';

export class PostEntity {
  constructor(
    protected title: string,
    protected shortDescription: string,
    content: string,
    blogId: string,
    likes: LikeEntity[],
    dislikes: LikeEntity[],
  ) {}
}
