export interface IPostApiModel {
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
    newestLikes: {
      addedAt: string;
      userId: string;
      login: string;
    }[];
  };
}

export interface IPostApiPaginationModel {
  pagesCount: number;
  page: number;
  pageSize: number;
  totalCount: number;
  items: IPostApiModel[];
}
