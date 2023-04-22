import { v4 as uuidv4 } from 'uuid';
import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export class Post {
  id: string;
  title: string;
  shortDescription: string;
  content: string;
  blogId: string;
  blogName: string;
  createdAt: string;
  constructor(createPostDTO: {
    title: string;
    shortDescription: string;
    content: string;
    blogId: string;
    blogName: string;
  }) {
    this.id = uuidv4();
    this.title = createPostDTO.title;
    this.shortDescription = createPostDTO.shortDescription;
    this.content = createPostDTO.content;
    this.blogId = createPostDTO.blogId;
    this.blogName = createPostDTO.blogName;
    this.createdAt = new Date().toISOString();
  }
}

class PostMethods extends Post {
  async testMethod(): Promise<string> {
    return this.id;
  }
}

@Schema({ versionKey: false, collection: 'posts' })
export class PostSchema extends PostMethods {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  shortDescription: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  blogId: string;

  @Prop({ required: true })
  blogName: string;

  @Prop({ required: true })
  createdAt: string;
}

export const postSchema = SchemaFactory.createForClass(PostSchema);
postSchema.loadClass(PostSchema);

export type PostDocumentType = HydratedDocument<PostSchema>;
