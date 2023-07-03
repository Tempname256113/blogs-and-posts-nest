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
