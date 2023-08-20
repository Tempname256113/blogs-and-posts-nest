import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtUtils } from '../../../../../libs/auth/jwt/jwt-utils.service';
import { QuizGamePublicApiViewModel } from '../../api/models/quiz-game-public-api.models';
import { JwtAccessTokenPayloadType } from '../../../../../generic-models/jwt.payload.model';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { QuizGamePairSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/quiz-game/quiz-game-pair.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository, SelectQueryBuilder } from 'typeorm';
import { QuizGamePairQuestionsSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/quiz-game/quiz-game-pair-questions.entity';
import { QuizGameQuestionSQLEntity } from '../../../../../libs/db/typeorm-sql/entities/quiz-game/quiz-game-question.entity';

export class ConnectUserToQuizCommand {
  constructor(
    public readonly data: {
      accessToken: string;
    },
  ) {}
}

@CommandHandler(ConnectUserToQuizCommand)
export class ConnectUserToQuizUseCase
  implements
    ICommandHandler<ConnectUserToQuizCommand, QuizGamePublicApiViewModel>
{
  constructor(
    private readonly jwtUtils: JwtUtils,
    @InjectRepository(QuizGamePairSQLEntity)
    private readonly quizGamePairEntity: Repository<QuizGamePairSQLEntity>,
    @InjectRepository(QuizGamePairQuestionsSQLEntity)
    private readonly quizGamePairQuestionsEntity: Repository<QuizGamePairQuestionsSQLEntity>,
    @InjectRepository(QuizGameQuestionSQLEntity)
    private readonly quizGameQuestionEntity: Repository<QuizGameQuestionSQLEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async execute({
    data,
  }: ConnectUserToQuizCommand): Promise<QuizGamePublicApiViewModel> {
    const userInfo: ReturnType<typeof this.getCurrentUserInfo> =
      this.getCurrentUserInfo(data.accessToken);
    await this.checkQuizGamesWithCurrentUser(userInfo.userId);
    const foundedQuizGamePair: QuizGamePairSQLEntity =
      await this.quizGamePairEntity.findOne({
        where: { status: 'PendingSecondPlayer' },
        relations: ['player1', 'player2', 'questions', 'answers'],
      });
    let quizGamePair: QuizGamePublicApiViewModel;
    if (foundedQuizGamePair) {
      quizGamePair = await this.connectUserToActivePair({
        quizGamePair: foundedQuizGamePair,
        userId: userInfo.userId,
        userLogin: userInfo.userLogin,
      });
    } else {
      quizGamePair = await this.createNewQuizGamePair({
        userId: userInfo.userId,
        userLogin: userInfo.userLogin,
      });
    }
    return quizGamePair;
  }

  getCurrentUserInfo(accessToken: string): {
    userId: string;
    userLogin: string;
  } {
    const accessTokenPayload: JwtAccessTokenPayloadType | null =
      this.jwtUtils.verifyAccessToken(accessToken);
    if (!accessTokenPayload) throw new UnauthorizedException();
    return {
      userId: String(accessTokenPayload.userId),
      userLogin: accessTokenPayload.userLogin,
    };
  }

  async checkQuizGamesWithCurrentUser(userId: string): Promise<void> {
    const foundedGameWithCurrentUser: QuizGamePairSQLEntity =
      await this.quizGamePairEntity.findOneBy([
        {
          player1Id: Number(userId),
          status: In(['PendingSecondPlayer', 'Active']),
        },
        { player2Id: Number(userId), status: 'Active' },
      ]);
    if (foundedGameWithCurrentUser) throw new ForbiddenException();
  }

  async connectUserToActivePair({
    quizGamePair,
    userId,
    userLogin,
  }: {
    quizGamePair: QuizGamePairSQLEntity;
    userId: string;
    userLogin: string;
  }): Promise<QuizGamePublicApiViewModel> {
    quizGamePair.status = 'Active';
    quizGamePair.player2Id = Number(userId);
    quizGamePair.startGameDate = new Date().toISOString();

    const queryBuilder: SelectQueryBuilder<QuizGameQuestionSQLEntity> =
      await this.dataSource.createQueryBuilder(QuizGameQuestionSQLEntity, 'q');
    const questions: QuizGameQuestionSQLEntity[] = await queryBuilder
      .select('q')
      .orderBy('RANDOM()')
      .limit(5)
      .getMany();
    let currentQuestionPosition = 0;
    for (const question of questions) {
      await this.quizGamePairQuestionsEntity.insert({
        quizGamePairId: quizGamePair.id,
        questionId: question.id,
        questionPosition: currentQuestionPosition,
      });
      currentQuestionPosition++;
    }
    await this.quizGamePairEntity.save(quizGamePair);
    return {
      id: String(quizGamePair.id),
      firstPlayerProgress: {
        answers: [],
        player: {
          id: String(quizGamePair.player1.id),
          login: quizGamePair.player1.login,
        },
        score: quizGamePair.player1Score,
      },
      secondPlayerProgress: {
        answers: [],
        player: {
          id: userId,
          login: userLogin,
        },
        score: quizGamePair.player2Score,
      },
      questions: questions.map((rawQuestion) => {
        return { id: String(rawQuestion.id), body: rawQuestion.body };
      }),
      status: quizGamePair.status,
      pairCreatedDate: quizGamePair.pairCreatedDate,
      startGameDate: quizGamePair.startGameDate,
      finishGameDate: null,
    };
  }

  async createNewQuizGamePair({
    userId,
    userLogin,
  }: {
    userId: string;
    userLogin: string;
  }): Promise<QuizGamePublicApiViewModel> {
    const newQuizGamePair: QuizGamePairSQLEntity = new QuizGamePairSQLEntity();
    newQuizGamePair.player1Id = Number(userId);
    newQuizGamePair.player2Id = null;
    newQuizGamePair.player1Score = 0;
    newQuizGamePair.player2Score = 0;
    newQuizGamePair.status = 'PendingSecondPlayer';
    newQuizGamePair.pairCreatedDate = new Date().toISOString();
    newQuizGamePair.startGameDate = null;
    newQuizGamePair.finishGameDate = null;
    const createdQuizPair: QuizGamePairSQLEntity =
      await this.quizGamePairEntity.save(newQuizGamePair);
    return {
      id: String(createdQuizPair.id),
      firstPlayerProgress: {
        answers: [],
        player: { id: userId, login: userLogin },
        score: createdQuizPair.player1Score,
      },
      secondPlayerProgress: null,
      questions: null,
      status: createdQuizPair.status,
      pairCreatedDate: createdQuizPair.pairCreatedDate,
      startGameDate: null,
      finishGameDate: null,
    };
  }
}
