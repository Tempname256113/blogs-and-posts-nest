import { PostCreateUpdateBloggerApiDTO } from '../src/blogger-api/blog/api/models/blog-blogger-api.dto';
import request, { Response } from 'supertest';
import { v4 as uuidv4 } from 'uuid';

// create new post through blogger api POST(blogger/blogs/:blogId/posts)
export const createPostTestFactoryFunction = async ({
  httpServer,
  userAccessToken,
  blogId,
}: {
  httpServer: any;
  userAccessToken: string;
  blogId: string;
}): Promise<Response> => {
  // title max length 30
  // shortDescription max length 100
  // content max length 1000
  const newPostDTO: PostCreateUpdateBloggerApiDTO = {
    title: uuidv4().slice(0, 20),
    shortDescription: uuidv4().slice(0, 30),
    content: uuidv4().slice(),
  };
  return request(httpServer)
    .post(`/blogger/blogs/${blogId}/posts`)
    .auth(userAccessToken, { type: 'bearer' })
    .send(newPostDTO);
};
