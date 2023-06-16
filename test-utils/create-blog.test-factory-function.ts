import { BlogBloggerApiCreateUpdateDTO } from '../src/blogger-api/blog/api/models/blog-blogger-api.dto';
import { v4 as uuidv4 } from 'uuid';
import request, { Response } from 'supertest';

// create new blog through blogger api POST(/blogger/blogs)
export const createBlogTestFactoryFunction = async ({
  httpServer,
  userAccessToken,
}: {
  userAccessToken: string;
  httpServer: any;
}): Promise<Response> => {
  // name max length 15
  // description max length 500
  // website url max length 100
  const newBlogDTO: BlogBloggerApiCreateUpdateDTO = {
    name: uuidv4().slice(0, 13),
    description: uuidv4(),
    websiteUrl: `https://someurl.com/${uuidv4().slice(0, 15)}`,
  };
  return request(httpServer)
    .post('/blogger/blogs')
    .auth(userAccessToken, {
      type: 'bearer',
    })
    .send(newBlogDTO);
};
