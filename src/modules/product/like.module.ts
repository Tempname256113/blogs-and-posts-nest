import { Module } from '@nestjs/common';
import { MongooseSchemesModule } from '../../../libs/db/mongoose/mongoose.schemes-module';
import { ChangeEntityLikeStatusUseCase } from '../../public-api/like/application/use-cases/change-entity-like-status.use-case';
import { LikeQueryRepository } from '../../public-api/like/infrastructure/repositories/like.query-repository';

const UseCases = [ChangeEntityLikeStatusUseCase];

@Module({
  imports: [MongooseSchemesModule],
  providers: [...UseCases, LikeQueryRepository],
  exports: [...UseCases, LikeQueryRepository],
})
export class LikeModule {}
