export type BloggerRepositoryCreatedBlogType = {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
};

export type BloggerRepositoryCreatedPostType = {
  id: string;
  blogId: string;
  title: string;
  shortDescription: string;
  content: string;
  createdAt: string;
};

export type BloggerRepositoryBlogType = {
  id: string;
  bloggerId: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
  isBanned: boolean;
  banDate: string | null;
  hidden: boolean;
};

export type BloggerRepositoryPostType = {
  id: string;
  blogId: string;
  title: string;
  shortDescription: string;
  content: string;
  createdAt: string;
  hidden: boolean;
};

export type BloggerRepositoryBannedUserType = {
  userId: string;
  blogId: string;
  banReason: string;
  banDate: string;
};

export type BloggerRepositoryUserType = {
  id: string;
  login: string;
  email: string;
  createdAt: string;
};
