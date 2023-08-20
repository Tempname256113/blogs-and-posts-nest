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
import { PublishQuizGameQuestionUseCase } from '../../admin-api/quiz-game/application/use-cases/publish-question.use-case';
import { QuizGamePublicController } from '../../public-api/quiz-game/api/quiz-game-public.controller';
import { JwtModule } from '../../../libs/auth/jwt/jwt.module';
import { ConnectUserToQuizUseCase } from '../../public-api/quiz-game/application/use-cases/connect-user-to-quiz.use-case';
import { AccessTokenGuard } from '../../../generic-guards/access-token.guard';
import { UserQueryRepositorySQL } from '../../admin-api/user/infrastructure/repositories/user.query-repository-sql';

const useCases = [
  CreateQuestionUseCase,
  DeleteQuizGameQuestionUseCase,
  UpdateQuizGameQuestionUseCase,
  PublishQuizGameQuestionUseCase,
  ConnectUserToQuizUseCase,
];

// в одном массиве потому что в нем зависимости гарда
const accessTokenGuard = [AccessTokenGuard, UserQueryRepositorySQL];

@Module({
  imports: [TypeormEntitiesModule, CqrsModule, JwtModule],
  providers: [
    AuthBasicStrategy,
    EnvConfiguration,
    AdminQuizGameRepositorySQL,
    AdminQuizGameQueryRepositorySQL,
    ...useCases,
    ...accessTokenGuard,
  ],
  controllers: [QuizGameAdminController, QuizGamePublicController],
})
export class QuizModule {}
