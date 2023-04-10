export class LikeEntity {
  constructor(
    protected myStatus: 'Like' | 'Dislike' | 'None',
    protected addedAt: string,
    protected userId: string,
    protected login: string,
  ) {}
}
