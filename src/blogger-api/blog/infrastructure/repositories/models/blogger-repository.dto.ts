export type BloggerRepositoryCreateBlogDTO = {
  bloggerId: string;
  name: string;
  description: string;
  websiteUrl: string;
};

export type BloggerRepositoryCreatePostDTO = {
  blogId: string;
  title: string;
  shortDescription: string;
  content: string;
};

export type BloggerRepositoryUpdateBlogDTO = {
  blogId: string;
  name: string;
  description: string;
  websiteUrl: string;
};

export type BloggerRepositoryUpdatePostDTO = {
  postId: string;
  title: string;
  shortDescription: string;
  content: string;
};
