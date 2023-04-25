import { Module } from '@nestjs/common';
import { BlogController } from './blog-api/blog-api-controllers/blog.controller';
import { BlogService } from './blog-application/blog.service';
import { BlogRepository } from './blog-infrastructure/blog-repositories/blog.repository';
import { BlogQueryRepository } from './blog-infrastructure/blog-repositories/blog.query-repository';
import { MongooseSchemesModule } from '../../app-configuration/db/mongoose.schemes-module';

@Module({
  imports: [MongooseSchemesModule],
  controllers: [BlogController],
  providers: [BlogService, BlogRepository, BlogQueryRepository],
})
export class BlogModule {}
