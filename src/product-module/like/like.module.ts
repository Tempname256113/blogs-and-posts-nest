import { Module } from '@nestjs/common';
import { MongooseSchemesModule } from '../../../libs/db/mongoose/mongoose.schemes-module';
import { ChangeEntityLikeStatusUseCase } from './like-application/like-application-use-cases/change-entity-like-status.use-case';
import { LikeQueryRepository } from './like.query-repository';

const UseCases = [ChangeEntityLikeStatusUseCase];

@Module({
  imports: [MongooseSchemesModule],
  providers: [...UseCases, LikeQueryRepository],
  exports: [...UseCases, LikeQueryRepository],
})
export class LikeModule {}
