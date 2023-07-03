import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Post } from './post.entity';
import { PostApiCreateUpdateDTO } from '../../../../src/public-api/post/api/models/post-api.dto';

export type Blog = {
  id: string;
  bloggerId: string;
  bloggerLogin: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
  isBanned?: boolean;
  banDate?: string | null;
  hidden?: boolean;
};

@Schema({ versionKey: false, collection: 'blogs' })
export class BlogSchema implements Blog {
  @Prop()
  id: string;

  @Prop()
  bloggerId: string;

  @Prop()
  bloggerLogin: string;

  @Prop()
  name: string;

  @Prop()
  description: string;

  @Prop()
  websiteUrl: string;

  @Prop()
  createdAt: string;

  @Prop()
  isMembership: boolean;

  @Prop({ default: false })
  isBanned: boolean;

  @Prop({ default: null })
  banDate: string | null;

  @Prop({ default: false })
  hidden: boolean;

  createPost(createPostDTO: PostApiCreateUpdateDTO): Post {
    const newPostDocument: Post = {
      id: uuidv4(),
      title: createPostDTO.title,
      shortDescription: createPostDTO.shortDescription,
      content: createPostDTO.content,
      blogId: this.id,
      blogName: this.name,
      bloggerId: this.bloggerId,
      createdAt: new Date().toISOString(),
    };
    return newPostDocument;
  }
}

export const blogSchema = SchemaFactory.createForClass(BlogSchema);
blogSchema.loadClass(BlogSchema);

export type BlogDocument = HydratedDocument<BlogSchema>;
