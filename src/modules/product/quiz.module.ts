import { Module } from '@nestjs/common';
import { TypeormEntitiesModule } from '../../../libs/db/typeorm-sql/typeorm.entities-module';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthBasicStrategy } from '../../../libs/auth/passport-strategy/auth-basic.strategy';
import { EnvConfiguration } from '../../../app-configuration/environment/env-configuration';
import { QuizGameAdminController } from '../../admin-api/quiz-game/api/quiz-game-admin.controller';
import { AdminQuizGameRepositorySQL } from '../../admin-api/quiz-game/infrastructure/repositories/quiz-game-admin.repository-sql';
import { CreateQuestionUseCase } from '../../admin-api/quiz-game/application/use-cases/create-question.use-case';
import { AdminQuizGameQueryRepositorySQL } from '../../admin-api/quiz-game/infrastructure/repositories/quiz-game-admin.query-repository';
import { DeleteQuizGameQuestionUseCase } from '../../admin-api/quiz-game/application/use-cases/delete-question.use-case';
import { UpdateQuizGameQuestionUseCase } from '../../admin-api/quiz-game/application/use-cases/update-question.use-case';

const useCases = [
  CreateQuestionUseCase,
  DeleteQuizGameQuestionUseCase,
  UpdateQuizGameQuestionUseCase,
];

@Module({
  imports: [TypeormEntitiesModule, CqrsModule],
  providers: [
    AuthBasicStrategy,
    EnvConfiguration,
    AdminQuizGameRepositorySQL,
    AdminQuizGameQueryRepositorySQL,
    ...useCases,
  ],
  controllers: [QuizGameAdminController],
})
export class QuizModule {}
