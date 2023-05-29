import { Model } from 'mongoose';

export const changeEntityLikeStatusFunc = (data: {
  entity: 'post' | 'comment';
  entityId: string;
  userId: string;
  userLogin: string;
  likeStatus: 'Like' | 'Dislike' | 'None';
  model: Model<any>;
}) => {
  const foundedEntity: any | null = data.model.findOne({ id: data.entityId });
};
