export type PostApiModel = {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
  extendedLikesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: 'None' | 'Like' | 'Dislike';
    newestLikes: PostNewestLikeType[];
  };
};

export type PostNewestLikeType = {
  addedAt: string;
  userId: string;
  login: string;
};

export type PostApiPaginationModelType = {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: PostApiModel[];
};
