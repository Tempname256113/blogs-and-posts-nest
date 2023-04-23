import { HydratedDocument, Model } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';
import { PostDocumentType, PostSchema } from '../post/post.entity';
import { IPostApiCreateUpdateDTO } from '../../post/post-api/post-api-models/post-api.dto';

export class Blog {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;
  constructor(createBlogDTO: {
    name: string;
    description: string;
    websiteUrl: string;
    isMembership: boolean;
  }) {
    this.id = uuidv4();
    this.name = createBlogDTO.name;
    this.description = createBlogDTO.description;
    this.websiteUrl = createBlogDTO.websiteUrl;
    this.createdAt = new Date().toISOString();
    this.isMembership = createBlogDTO.isMembership;
  }
}

class BlogMethods extends Blog {
  createPost(
    createPostDTO: IPostApiCreateUpdateDTO,
    PostModel: Model<PostSchema>,
  ): PostDocumentType {
    const newPostDocument: PostDocumentType = new PostModel({
      id: uuidv4(),
      title: createPostDTO.title,
      shortDescription: createPostDTO.shortDescription,
      content: createPostDTO.content,
      blogId: this.id,
      blogName: this.name,
      createdAt: new Date().toISOString(),
    });
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
