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
import { QuizGameAnswerSQLEntity } from './entities/quiz-game/quiz-game-answer.entity';
import { QuizGamePairSQLEntity } from './entities/quiz-game/quiz-game-pair.entity';
import { QuizGamePairQuestionsSQLEntity } from './entities/quiz-game/quiz-game-pair-questions.entity';
import { QuizGamePairAnswersSQLEntity } from './entities/quiz-game/quiz-game-pair-answers.entity';

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
      QuizGameAnswerSQLEntity,
      QuizGamePairSQLEntity,
      QuizGamePairQuestionsSQLEntity,
      QuizGamePairAnswersSQLEntity,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class TypeormEntitiesModule {}
