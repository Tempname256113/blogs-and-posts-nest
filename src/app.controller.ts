import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PostSchema } from '../libs/db/mongoose/schemes/post.entity';
import { Model } from 'mongoose';
import { BlogSchema } from '../libs/db/mongoose/schemes/blog.entity';
import { UserSchema } from '../libs/db/mongoose/schemes/user.entity';
import { SessionSchema } from '../libs/db/mongoose/schemes/session.entity';
import { CommentSchema } from '../libs/db/mongoose/schemes/comment.entity';
import { LikeSchema } from '../libs/db/mongoose/schemes/like.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSQLEntity } from '../libs/db/typeorm-sql/entities/users/user-sql.entity';
import { SessionSQLEntity } from '../libs/db/typeorm-sql/entities/users/session-sql.entity';
import { UserEmailConfirmInfoSQLEntity } from '../libs/db/typeorm-sql/entities/users/user-email-confirm-info-sql.entity';
import { UserPasswordRecoveryInfoSQLEntity } from '../libs/db/typeorm-sql/entities/users/user-password-recovery-info-sql.entity';
import { BannedUsersByBloggerSQLEntity } from '../libs/db/typeorm-sql/entities/users/banned-users-by-blogger-sql.entity';
import { BlogSQLEntity } from '../libs/db/typeorm-sql/entities/blog-sql.entity';
import { PostSQLEntity } from '../libs/db/typeorm-sql/entities/post-sql.entity';
import { CommentSQLEntity } from '../libs/db/typeorm-sql/entities/comment-sql.entity';
import { LikeSQLEntity } from '../libs/db/typeorm-sql/entities/like-sql.entity';
import { QuizGameQuestionSQLEntity } from '../libs/db/typeorm-sql/entities/quiz-game/quiz-game-question.entity';
import { QuizGameAnswerSQLEntity } from '../libs/db/typeorm-sql/entities/quiz-game/quiz-game-answer.entity';

@Controller('testing')
export class AppController {
  constructor(
    @InjectModel(PostSchema.name) private PostModel: Model<PostSchema>,
    @InjectModel(BlogSchema.name) private BlogModel: Model<BlogSchema>,
    @InjectModel(UserSchema.name) private UserModel: Model<UserSchema>,
    @InjectModel(SessionSchema.name) private SessionModel: Model<SessionSchema>,
    @InjectModel(CommentSchema.name) private CommentModel: Model<CommentSchema>,
    @InjectModel(LikeSchema.name) private LikeModel: Model<LikeSchema>,
    @InjectRepository(UserSQLEntity)
    private readonly userEntity: Repository<UserSQLEntity>,
    @InjectRepository(UserEmailConfirmInfoSQLEntity)
    private readonly userEmailConfirmInfoEntity: Repository<UserEmailConfirmInfoSQLEntity>,
    @InjectRepository(UserPasswordRecoveryInfoSQLEntity)
    private readonly userPasswordRecoveryInfoEntity: Repository<UserPasswordRecoveryInfoSQLEntity>,
    @InjectRepository(SessionSQLEntity)
    private readonly sessionEntity: Repository<SessionSQLEntity>,
    @InjectRepository(BannedUsersByBloggerSQLEntity)
    private readonly bannedUsersByBloggerEntity: Repository<BannedUsersByBloggerSQLEntity>,
    @InjectRepository(BlogSQLEntity)
    private readonly blogEntity: Repository<BlogSQLEntity>,
    @InjectRepository(PostSQLEntity)
    private readonly postEntity: Repository<PostSQLEntity>,
    @InjectRepository(CommentSQLEntity)
    private readonly commentEntity: Repository<CommentSQLEntity>,
    @InjectRepository(LikeSQLEntity)
    private readonly likeEntity: Repository<LikeSQLEntity>,
    @InjectRepository(QuizGameQuestionSQLEntity)
    private readonly quizGameQuestionEntity: Repository<QuizGameQuestionSQLEntity>,
    @InjectRepository(QuizGameAnswerSQLEntity)
    private readonly quizGameAnswerEntity: Repository<QuizGameAnswerSQLEntity>,
  ) {}
  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAllData() {
    await Promise.all([
      this.PostModel.deleteMany(),
      this.BlogModel.deleteMany(),
      this.UserModel.deleteMany(),
      this.SessionModel.deleteMany(),
      this.CommentModel.deleteMany(),
      this.LikeModel.deleteMany(),
      this.userEntity.delete({}),
      this.userEmailConfirmInfoEntity.delete({}),
      this.userPasswordRecoveryInfoEntity.delete({}),
      this.sessionEntity.delete({}),
      this.bannedUsersByBloggerEntity.delete({}),
      this.blogEntity.delete({}),
      this.postEntity.delete({}),
      this.commentEntity.delete({}),
      this.likeEntity.delete({}),
      this.quizGameQuestionEntity.delete({}),
      this.quizGameAnswerEntity.delete({}),
    ]);
  }
}
