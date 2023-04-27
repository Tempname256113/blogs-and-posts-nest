import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Post } from './post.entity';
import { IPostApiCreateUpdateDTO } from '../post/post-api/post-api-models/post-api.dto';

export class Blog {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
}

class BlogMethods extends Blog {
  createPost(createPostDTO: IPostApiCreateUpdateDTO): Post {
    const newPostDocument: Post = {
      id: uuidv4(),
      title: createPostDTO.title,
      shortDescription: createPostDTO.shortDescription,
      content: createPostDTO.content,
      blogId: this.id,
      blogName: this.name,
      createdAt: new Date().toISOString(),
    };
    return newPostDocument;
  }
}

@Schema({ versionKey: false, collection: 'blogs' })
export class BlogSchema extends BlogMethods implements Blog {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  websiteUrl: string;

  @Prop({ required: true })
  createdAt: string;

  @Prop({ required: true })
  isMembership: boolean;
}

export const blogSchema = SchemaFactory.createForClass(BlogSchema);
blogSchema.loadClass(BlogSchema);

export type BlogDocument = HydratedDocument<BlogSchema>;
