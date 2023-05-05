import { Module } from '@nestjs/common';
import { MongooseSchemesModule } from '../../../libs/db/mongoose/mongoose.schemes-module';
import { LikeService } from './like.service';

@Module({
  imports: [MongooseSchemesModule],
  providers: [LikeService],
  exports: [LikeService],
})
export class LikeModule {}
