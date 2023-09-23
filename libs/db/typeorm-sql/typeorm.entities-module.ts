import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSQLEntity } from './entities/users/user-sql.entity';
import { UserEmailConfirmInfoSQLEntity } from './entities/users/user-email-confirm-info-sql.entity';
import { UserPasswordRecoveryInfoSQLEntity } from './entities/users/user-password-recovery-info-sql.entity';
import { SessionSQLEntity } from './entities/users/session-sql.entity';
import { BlogSQLEntity } from './entities/blog-sql.entity';
import { PostSQLEntity } from './entities/post-sql.entity';
import { BannedUsersByBloggerSQLEntity } from './entities/users/banned-users-by-blogger-sql.entity';
import { CommentSQLEntity } from './entities/comment-sql.entity';
import { LikeSQLEntity } from './entities/like-sql.entity';
import { QuizGameQuestionSQLEntity } from './entities/quiz-game/quiz-game-question.entity';
import { QuizGamePairSQLEntity } from './entities/quiz-game/quiz-game-pair.entity';
import { QuizGamePairQuestionWithPositionSQLEntity } from './entities/quiz-game/quiz-game-pair-question-with-position.entity';
import { QuizGamePairAnswerSQLEntity } from './entities/quiz-game/quiz-game-pair-answer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserSQLEntity,
      UserEmailConfirmInfoSQLEntity,
      UserPasswordRecoveryInfoSQLEntity,
      SessionSQLEntity,
      BlogSQLEntity,
      PostSQLEntity,
      BannedUsersByBloggerSQLEntity,
      CommentSQLEntity,
      LikeSQLEntity,
      QuizGameQuestionSQLEntity,
      QuizGamePairSQLEntity,
      QuizGamePairQuestionWithPositionSQLEntity,
      QuizGamePairAnswerSQLEntity,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class TypeormEntitiesModule {}
