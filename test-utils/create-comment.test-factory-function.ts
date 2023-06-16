import request, { Response } from 'supertest';
import { CommentApiCreateDto } from '../src/public-api/comment/api/models/comment-api.dto';
import { v4 as uuidv4 } from 'uuid';

// create new comment through public api POST(/posts/:postId/comments)
export const createCommentTestFactoryFunction = async ({
  httpServer,
  userAccessToken,
  postId,
  commentCreateDTO,
}: {
  httpServer: any;
  userAccessToken: string;
  postId: string;
  commentCreateDTO?: CommentApiCreateDto;
}): Promise<Response> => {
  // content min length 20 max length 300
  let newCommentDTO: CommentApiCreateDto = {
    content: uuidv4(),
  };
  if (commentCreateDTO) {
    newCommentDTO = commentCreateDTO;
  }
  return request(httpServer)
    .post(`/posts/${postId}/comments`)
    .auth(userAccessToken, { type: 'bearer' })
    .send(newCommentDTO);
};
